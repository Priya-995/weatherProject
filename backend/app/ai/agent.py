import json
from datetime import datetime, timedelta, timezone
from typing import Any
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage
from langchain_groq import ChatGroq
from sqlalchemy.ext.asyncio import AsyncSession
from app.ai.weather_tools import ALL_WEATHER_TOOLS, TOOL_BY_NAME
from app.config import get_settings
from app.db import repository as repo

LANGUAGE_LABELS: dict[str, str] = {
    "en": "English",
    "hi": "Hindi (हिन्दी)",
    "gu": "Gujarati (ગુજરાતી)",
    "bn": "Bengali (বাংলা)",
    "mr": "Marathi (मराठी)",
    "ta": "Tamil (தமிழ்)",
    "te": "Telugu (తెలుగు)",
    "kn": "Kannada (ಕನ್ನಡ)",
    "ml": "Malayalam (മലയാളം)",
    "pa": "Punjabi (ਪੰਜਾਬੀ)",
}


def _ist_date(offset_days: int = 0) -> str:
    ist = datetime.now(timezone.utc) + timedelta(hours=5, minutes=30, days=offset_days)
    return ist.date().isoformat()


def _get_role_guidance(user_type: str) -> str:
    if user_type == "farmer":
        return "\n".join([
            "USER ROLE: Farmer.",
            "- Speak in simple, practical everyday language without technical meteorological jargon.",
            "- Focus on rainfall timing, temperature, humidity, wind speed (for spraying), irrigation planning, and field/harvest protection.",
            "- Do NOT invent crop-specific agronomic prescriptions without sufficient weather and official Agromet data.",
        ])
    if user_type == "government":
        return "\n".join([
            "USER ROLE: Government Agency.",
            "- Focus on regional/district monitoring, official IMD/NDMA warning severity, validity periods, affected districts/areas, and rainfall/temperature trends.",
            "- Clearly cite official issuing authorities and distinguish official warnings from AI-generated summaries.",
        ])
    if user_type == "disaster":
        return "\n".join([
            "USER ROLE: Disaster Manager.",
            "- Focus on operational readiness: active severe weather events, affected districts, warning timelines, heavy rain/cyclone/thunderstorm risk, and preparedness checklists.",
            "- Never present AI-generated recommendations as official government directives.",
        ])
    return "\n".join([
        "USER ROLE: Everyday Citizen.",
        "- Use friendly, simple everyday language without technical weather jargon.",
        "- Focus on daily planning: commuting, umbrella/clothing advice, outdoor activities, and practical safety precautions.",
    ])


def _build_system_prompt(
    language: str,
    active_location: str | None,
    active_date: str | None,
    user_type: str = "citizen",
) -> str:
    lang_label = LANGUAGE_LABELS.get(language, "English")
    today = _ist_date(0)
    tomorrow = _ist_date(1)
    return "\n".join([
        "You are WeatherGPT, an accurate meteorological intelligence assistant powered by live Open-Meteo and IMD data.",
        f"Reference dates (IST): today is {today}, tomorrow is {tomorrow}.",
        f"Active conversation context -> Location: {active_location or 'None yet'}, Target Date: {active_date or today}.",
        _get_role_guidance(user_type),
        "STRICT GROUNDING RULES:",
        "1. Always call the appropriate weather or flood prediction tool(s) before answering. Never fabricate numbers, flood probabilities, or alerts.",
        f"2. Contextual follow-ups: Retain Location ({active_location or 'ask if none'}) and Target Date ({active_date or today}) when omitted in follow-ups like 'What about in the morning?' or 'Should I carry an umbrella?'. If the user switches city, update the city while preserving the Target Date unless a new date is stated.",
        "3. Clearly separate official IMD/NDMA/CWC warnings from derived meteorological advisories and experimental ML 3-day flood-onset predictions. Never treat ML outputs as official government warnings.",
        "4. When get_flood_prediction returns status='unavailable', explain the exact reason (unsupported district, outside June–October monsoon, missing Open-Meteo data, or missing model artifacts) without guessing.",
        "5. Always cite the data source in your reply.",
        f"6. Respond strictly in {lang_label}.",
    ])


def _derive_title(text: str) -> str:
    cleaned = text.strip().rstrip("?!.")
    if not cleaned:
        return "Weather Inquiry"
    return f"{cleaned[:45].strip()}..." if len(cleaned) > 48 else cleaned


async def run_weathergpt_turn(
    db: AsyncSession,
    *,
    conversation_id: str,
    user_message: str,
    language: str = "en",
    user_type: str | None = None,
    default_location: str | None = None,
) -> dict[str, Any]:
    settings = get_settings()
    if not settings.groq_api_key or settings.groq_api_key == "your_groq_api_key_here":
        raise RuntimeError("GROQ_API_KEY is not configured on the FastAPI server.")

    conv = await repo.get_conversation(db, conversation_id)
    if not conv:
        raise ValueError("Conversation not found.")

    effective_role = user_type or conv.user_type or "citizen"
    existing = await repo.get_messages(db, conversation_id)
    new_records = []

    active_loc = conv.active_location or default_location
    active_date = conv.active_date
    system_prompt = _build_system_prompt(language, active_loc, active_date, effective_role)

    if not existing:
        sys_rec = await repo.append_message(
            db, conversation_id=conv.id, role="system", content=system_prompt, language=language
        )
        new_records.append(sys_rec)

    user_rec = await repo.append_message(
        db, conversation_id=conv.id, role="user", content=user_message, language=language
    )
    new_records.append(user_rec)

    if conv.title in ("New Weather Conversation", "New Chat"):
        conv = await repo.update_conversation(
            db, conversation_id, title=_derive_title(user_message), language=language, user_type=effective_role
        ) or conv
    elif conv.language != language or conv.user_type != effective_role:
        conv = await repo.update_conversation(
            db, conversation_id, language=language, user_type=effective_role
        ) or conv

    all_history = await repo.get_messages(db, conversation_id)
    lc_messages: list[Any] = [SystemMessage(content=system_prompt)]
    for m in all_history:
        if m.role == "system":
            continue
        if m.role == "user":
            lc_messages.append(HumanMessage(content=m.content))
        elif m.role == "assistant":
            if m.tool_calls:
                lc_messages.append(
                    AIMessage(
                        content=m.content or "",
                        tool_calls=[
                            {"id": tc["id"], "name": tc["name"], "args": tc.get("arguments", {})}
                            for tc in m.tool_calls
                        ],
                    )
                )
            else:
                lc_messages.append(AIMessage(content=m.content))
        elif m.role == "tool":
            payload = m.tool_result if isinstance(m.tool_result, str) else json.dumps(m.tool_result or m.content)
            lc_messages.append(ToolMessage(content=payload, tool_call_id=m.tool_call_id or ""))

    llm = ChatGroq(
        api_key=settings.groq_api_key,
        model=settings.groq_model,
        temperature=0.2,
        max_tokens=4096,
    ).bind_tools(ALL_WEATHER_TOOLS)

    for _ in range(4):
        ai_msg: AIMessage = await llm.ainvoke(lc_messages)
        tool_calls = getattr(ai_msg, "tool_calls", None) or []

        if tool_calls:
            normalized_calls = [
                {"id": tc["id"], "name": tc["name"], "arguments": tc.get("args", {})}
                for tc in tool_calls
            ]
            tc_rec = await repo.append_message(
                db,
                conversation_id=conv.id,
                role="assistant",
                content=str(ai_msg.content or ""),
                tool_calls=normalized_calls,
                language=language,
            )
            new_records.append(tc_rec)
            lc_messages.append(ai_msg)

            for tc in normalized_calls:
                tool_fn = TOOL_BY_NAME.get(tc["name"])
                args = dict(tc["arguments"])
                if "location" not in args and active_loc and tc["name"] != "compare_locations":
                    args["location"] = active_loc
                if "date" not in args and active_date and tc["name"] in {
                    "get_hourly_forecast", "get_rain_probability", "get_wind_info", "compare_locations"
                }:
                    args["date"] = active_date

                try:
                    result = await tool_fn.ainvoke(args) if tool_fn else {"error": f"Unknown tool {tc['name']}"}
                except Exception as exc:
                    result = {"error": True, "message": str(exc)}

                if isinstance(result, dict):
                    if isinstance(result.get("location"), str):
                        active_loc = result["location"]
                    if isinstance(result.get("date"), str):
                        active_date = result["date"]

                tool_rec = await repo.append_message(
                    db,
                    conversation_id=conv.id,
                    role="tool",
                    content=json.dumps(result),
                    tool_call_id=tc["id"],
                    tool_name=tc["name"],
                    tool_result=result,
                    language=language,
                )
                new_records.append(tool_rec)
                lc_messages.append(ToolMessage(content=json.dumps(result), tool_call_id=tc["id"]))

            conv = await repo.update_conversation(
                db, conversation_id, active_location=active_loc, active_date=active_date
            ) or conv
            continue

        final_rec = await repo.append_message(
            db,
            conversation_id=conv.id,
            role="assistant",
            content=str(ai_msg.content or "").strip(),
            language=language,
        )
        new_records.append(final_rec)
        break

    final_messages = await repo.get_messages(db, conversation_id)
    return {
        "conversation": repo.serialize_conversation(conv, len([m for m in final_messages if m.role in ("user", "assistant")])),
        "messages": [repo.serialize_message(m) for m in final_messages],
        "newMessages": [repo.serialize_message(m) for m in new_records],
    }


async def explain_alert_with_groq(
    *,
    alert: dict[str, Any],
    user_type: str = "citizen",
    language: str = "en",
) -> dict[str, Any]:
    settings = get_settings()
    if not settings.groq_api_key or settings.groq_api_key == "your_groq_api_key_here":
        raise RuntimeError("GROQ_API_KEY is not configured on the FastAPI server.")

    lang_label = LANGUAGE_LABELS.get(language, "English")
    if user_type == "citizen":
        focus = "- What is happening\n- Which area is affected and when\n- Everyday safety & travel precautions"
    elif user_type == "farmer":
        focus = "- How this weather may affect farming activities\n- Practical precautions for crops, livestock, or equipment\n- Whether irrigation or spraying plans should be reviewed"
    elif user_type == "government":
        focus = "- Affected districts and area scope\n- Warning validity window\n- Areas requiring administrative monitoring"
    else:
        focus = "- Expected severe weather event\n- Affected areas and timeline\n- Operational preparedness suggestions (non-official)"

    prompt = "\n".join([
        "Simplify the following official government weather warning into clear, practical guidance tailored to the user role below.",
        f"Do NOT alter the official severity ({alert.get('severity')}) or present your suggestions as official government directives.",
        f"Respond strictly in {lang_label} with short bullet points covering:",
        focus,
        "\nOFFICIAL WARNING DATA:",
        f"Title: {alert.get('title')}",
        f"Issuing Authority: {alert.get('issuing_authority')}",
        f"Official Severity: {alert.get('severity')} ({alert.get('official_severity_label') or alert.get('severity')})",
        f"Affected Area: {alert.get('affected_area')}",
        f"Valid From: {alert.get('valid_from') or 'Not specified'} | Valid Until: {alert.get('valid_until') or 'Not specified'}",
        f"Official Description: {alert.get('description')}",
    ])

    llm = ChatGroq(
        api_key=settings.groq_api_key,
        model=settings.groq_model,
        temperature=0.2,
        max_tokens=1024,
    )
    ai_msg: AIMessage = await llm.ainvoke([
        SystemMessage(content=f"You simplify official weather bulletins clearly without jargon. {_get_role_guidance(user_type)}"),
        HumanMessage(content=prompt),
    ])
    return {
        "explanation": str(ai_msg.content or "").strip() or "Unable to generate explanation.",
        "is_official": False,
        "model": settings.groq_model,
    }
