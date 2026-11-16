from datetime import datetime, timezone
from typing import Any
import httpx
from app.config import get_settings
from app.services.open_meteo import fetch_normalized_weather


def _classify_event(text: str) -> str:
    lower = text.lower()
    if "cyclone" in lower or "depression" in lower:
        return "Cyclone"
    if "heat" in lower:
        return "Heatwave"
    if "thunder" in lower or "lightning" in lower:
        return "Thunderstorm"
    if "rain" in lower or "flood" in lower:
        return "Heavy Rainfall"
    if "wind" in lower or "squall" in lower or "gale" in lower:
        return "Strong Winds"
    return "Weather Warning"


def _classify_severity(text: str, raw_severity: str | None = None) -> tuple[str, int, str]:
    combined = f"{text} {raw_severity or ''}".lower()
    official_label = " · ".join([p for p in [raw_severity, text] if p]) or "Official Bulletin"
    if "red" in combined or "extreme" in combined or "warning" in combined:
        return "Red", 5, official_label
    if "orange" in combined:
        return "Orange", 4, official_label
    if "yellow" in combined:
        return "Yellow", 3, official_label
    if "alert" in combined:
        return "Alert", 3, official_label
    if "watch" in combined:
        return "Watch", 2, official_label
    return "Advisory", 1, official_label


def _compute_lifecycle(valid_from: str | None, valid_until: str | None) -> str:
    now = datetime.now(timezone.utc)
    try:
        if valid_until:
            until_dt = datetime.fromisoformat(valid_until.replace("Z", "+00:00"))
            if until_dt.tzinfo is None:
                until_dt = until_dt.replace(tzinfo=timezone.utc)
            if now > until_dt:
                return "expired"
    except Exception:
        pass
    try:
        if valid_from:
            from_dt = datetime.fromisoformat(valid_from.replace("Z", "+00:00"))
            if from_dt.tzinfo is None:
                from_dt = from_dt.replace(tzinfo=timezone.utc)
            if now < from_dt:
                return "upcoming"
    except Exception:
        pass
    return "active"


def _extract_state(area: str, authority: str, msg: str) -> str | None:
    haystack = f"{area} {authority} {msg}".lower()
    states = [
        "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi",
        "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
        "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
        "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
        "Uttar Pradesh", "Uttarakhand", "West Bengal", "Jammu and Kashmir", "Ladakh",
    ]
    for st in states:
        if st.lower() in haystack:
            return st
    return None


async def fetch_weather_alerts(location: dict[str, Any]) -> dict[str, Any]:
    settings = get_settings()
    checked_at = datetime.now(timezone.utc).isoformat()
    official_alerts: list[dict[str, Any]] = []
    national_alerts: list[dict[str, Any]] = []
    expired_count = 0
    duplicates_removed = 0
    feed_status = {
        "status": "unavailable",
        "provider": "India Meteorological Department (IMD) / NDMA Sachet CAP Feed",
        "message": "Official IMD/NDMA warning feed is currently unreachable.",
        "checked_at": checked_at,
        "feed_url": settings.ndma_sachet_cap_url,
    }

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(settings.ndma_sachet_cap_url, headers={"Accept": "application/json"})
            resp.raise_for_status()
            payload = resp.json()
            rows = payload if isinstance(payload, list) else payload.get("alerts", [])
            terms = [
                str(t).lower()
                for t in [location.get("name"), location.get("admin1")]
                if t
            ]
            is_india = not location.get("country_code") or location.get("country_code") == "IN"
            seen_keys: set[str] = set()

            for idx, item in enumerate(rows):
                area = str(item.get("area_description") or item.get("areaDesc") or item.get("state") or "India")
                headline = str(item.get("disaster_type") or item.get("headline") or item.get("event") or "Official Weather Alert")
                desc = str(item.get("warning_message") or item.get("description") or headline)
                authority = str(item.get("alert_source") or item.get("senderName") or "India Meteorological Department / NDMA")
                valid_from = str(item["effective_start_time"]) if item.get("effective_start_time") else None
                valid_until = str(item["effective_end_time"]) if item.get("effective_end_time") else None
                alert_id = str(item.get("identifier") or item.get("id") or f"imd-{idx + 1}")
                dedup_key = f"{headline.lower()}|{area.lower()}|{valid_from or ''}"
                if alert_id in seen_keys or dedup_key in seen_keys:
                    duplicates_removed += 1
                    continue
                seen_keys.add(alert_id)
                seen_keys.add(dedup_key)

                sev, rank, official_label = _classify_severity(
                    str(item.get("severity_color") or item.get("severity") or desc),
                    str(item["severity"]) if item.get("severity") else None,
                )
                status = _compute_lifecycle(valid_from, valid_until)
                if status == "expired":
                    expired_count += 1
                affected_state = _extract_state(area, authority, desc)

                formatted = {
                    "id": alert_id,
                    "title": headline,
                    "event_type": _classify_event(f"{headline} {desc}"),
                    "severity": sev,
                    "severity_rank": rank,
                    "official_severity_label": official_label,
                    "issuing_authority": authority,
                    "affected_state": affected_state,
                    "affected_district": area,
                    "affected_area": area,
                    "issued_at": valid_from,
                    "valid_from": valid_from,
                    "valid_until": valid_until,
                    "status": status,
                    "description": desc,
                    "precautions": [
                        "Follow local IMD and State Disaster Management Authority instructions.",
                        "Monitor official bulletins before planning travel or outdoor work.",
                    ],
                    "source": "Official NDMA Sachet / IMD CAP Feed",
                    "source_link": "https://sachet.ndma.gov.in",
                    "is_official": True,
                }

                area_l = area.lower()
                msg_l = desc.lower()
                auth_l = authority.lower()
                state_l = (affected_state or "").lower()
                is_local = is_india and any(
                    term and (term in area_l or term in msg_l or term in auth_l or state_l == term)
                    for term in terms
                )
                if is_local:
                    official_alerts.append(formatted)
                elif len(national_alerts) < 20:
                    national_alerts.append(formatted)

            def _sort_key(a: dict[str, Any]) -> tuple[int, int]:
                sw = 3 if a["status"] == "active" else (2 if a["status"] == "upcoming" else 1)
                return (-sw, -int(a.get("severity_rank") or 0))

            official_alerts.sort(key=_sort_key)
            national_alerts.sort(key=_sort_key)

            feed_status = {
                "status": "available",
                "provider": "India Meteorological Department (IMD) / NDMA Sachet CAP Feed",
                "message": (
                    f"{len(official_alerts)} official bulletin(s) matched {location.get('name')} ({len(rows)} total active across India)."
                    if official_alerts
                    else f"Connected to live official CAP feed ({len(rows)} bulletin(s) across India). None currently target {location.get('name')}."
                ),
                "checked_at": checked_at,
                "feed_url": settings.ndma_sachet_cap_url,
            }
    except Exception as exc:
        feed_status = {
            "status": "unavailable",
            "provider": "India Meteorological Department (IMD) / NDMA Sachet CAP Feed",
            "message": f"Official IMD/NDMA feed unavailable ({exc}). This does not imply no weather hazard exists.",
            "checked_at": checked_at,
            "feed_url": settings.ndma_sachet_cap_url,
        }

    advisories: list[dict[str, Any]] = []
    try:
        wx = await fetch_normalized_weather(location)
        hours_24 = wx["hourly"][:24]
        max_temp = max([h["temperature_c"] for h in hours_24] + [wx["current"]["temperature_c"]])
        max_rain_prob = max([h["rain_probability_percent"] for h in hours_24] or [0])
        total_rain = sum(h["precipitation_mm"] for h in hours_24)
        max_wind = max([h["wind_speed_kmh"] for h in hours_24] + [wx["current"]["wind_speed_kmh"]])

        if max_temp >= 40:
            advisories.append({
                "id": "adv-heat",
                "title": "Elevated Heat Stress Threshold",
                "event_type": "Heatwave Advisory (Derived)",
                "severity": "High" if max_temp >= 44 else "Moderate",
                "location_name": location["name"],
                "summary": f"Open-Meteo forecasts peak temperatures reaching {max_temp:.1f}°C in the next 24 hours.",
                "precautions": [
                    "Avoid direct outdoor exposure between 12:00 PM and 4:00 PM.",
                    "Maintain hydration with water and electrolytes.",
                ],
                "source": "Derived from Open-Meteo Forecast Thresholds (Non-Official)",
                "is_official": False,
            })

        if total_rain >= 20 or max_rain_prob >= 70:
            advisories.append({
                "id": "adv-rain",
                "title": "Significant Rainfall Probability",
                "event_type": "Rainfall Advisory (Derived)",
                "severity": "High" if total_rain >= 50 else "Moderate",
                "location_name": location["name"],
                "summary": f"Open-Meteo indicates up to {max_rain_prob:.0f}% rain probability and ~{total_rain:.1f} mm rain in 24h.",
                "precautions": [
                    "Carry waterproof gear and plan for localized waterlogging.",
                ],
                "source": "Derived from Open-Meteo Forecast Thresholds (Non-Official)",
                "is_official": False,
            })

        if max_wind >= 35:
            advisories.append({
                "id": "adv-wind",
                "title": "Strong Wind Advisory",
                "event_type": "Strong Winds (Derived)",
                "severity": "High" if max_wind >= 55 else "Moderate",
                "location_name": location["name"],
                "summary": f"Forecast wind speeds may reach {max_wind:.1f} km/h over the next 24 hours.",
                "precautions": [
                    "Secure loose outdoor objects and drive carefully on open highways.",
                ],
                "source": "Derived from Open-Meteo Forecast Thresholds (Non-Official)",
                "is_official": False,
            })
    except Exception:
        pass

    return {
        "location": location,
        "official_alerts": official_alerts,
        "national_alerts": national_alerts,
        "expired_count": expired_count,
        "duplicates_removed": duplicates_removed,
        "official_feed_status": feed_status,
        "advisories": advisories,
        "last_updated": checked_at,
    }
