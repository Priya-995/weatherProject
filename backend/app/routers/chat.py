from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from app.ai.agent import run_weathergpt_turn
from app.db import repository as repo
from app.db.database import get_db

router = APIRouter(prefix="/api", tags=["chat"])


class CreateConversationBody(BaseModel):
    session_id: str = "demo-session"
    title: str = "New Weather Conversation"
    active_location: str | None = None
    active_date: str | None = None
    language: str = "en"
    user_type: str = "citizen"


class UpdateConversationBody(BaseModel):
    title: str | None = None
    active_location: str | None = None
    active_date: str | None = None
    language: str | None = None
    user_type: str | None = None


class ChatRequestBody(BaseModel):
    conversation_id: str | None = None
    session_id: str = "demo-session"
    message: str = Field(..., min_length=1)
    language: str = "en"
    user_type: str = "citizen"
    default_location: str | None = None


@router.get("/conversations")
async def list_conversations(
    session_id: str = Query("demo-session"),
    db: AsyncSession = Depends(get_db),
):
    items = await repo.list_conversations(db, session_id)
    return {"conversations": items, "storage": {"mode": "postgresql", "label": "PostgreSQL Persistent Store"}}


@router.post("/conversations", status_code=201)
async def create_conversation(
    body: CreateConversationBody,
    db: AsyncSession = Depends(get_db),
):
    conv = await repo.create_conversation(
        db,
        session_id=body.session_id,
        title=body.title,
        active_location=body.active_location,
        active_date=body.active_date,
        language=body.language,
        user_type=body.user_type,
    )
    return {"conversation": repo.serialize_conversation(conv, 0)}


@router.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str, db: AsyncSession = Depends(get_db)):
    conv = await repo.get_conversation(db, conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    msgs = await repo.get_messages(db, conversation_id)
    return {
        "conversation": repo.serialize_conversation(
            conv, len([m for m in msgs if m.role in ("user", "assistant")])
        ),
        "messages": [repo.serialize_message(m) for m in msgs],
    }


@router.patch("/conversations/{conversation_id}")
async def patch_conversation(
    conversation_id: str,
    body: UpdateConversationBody,
    db: AsyncSession = Depends(get_db),
):
    conv = await repo.update_conversation(
        db,
        conversation_id,
        title=body.title,
        active_location=body.active_location,
        active_date=body.active_date,
        language=body.language,
        user_type=body.user_type,
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"conversation": repo.serialize_conversation(conv)}


@router.delete("/conversations/{conversation_id}")
async def remove_conversation(conversation_id: str, db: AsyncSession = Depends(get_db)):
    ok = await repo.delete_conversation(db, conversation_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"deleted": True}


@router.post("/chat")
async def chat_endpoint(body: ChatRequestBody, db: AsyncSession = Depends(get_db)):
    conv_id = body.conversation_id
    if not conv_id:
        conv = await repo.create_conversation(
            db,
            session_id=body.session_id,
            active_location=body.default_location,
            language=body.language,
            user_type=body.user_type,
        )
        conv_id = str(conv.id)

    try:
        return await run_weathergpt_turn(
            db,
            conversation_id=conv_id,
            user_message=body.message.strip(),
            language=body.language,
            user_type=body.user_type,
            default_location=body.default_location,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail={"error": "GROQ_API_KEY_MISSING", "message": str(exc)})
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
