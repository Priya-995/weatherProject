import uuid
from datetime import datetime, timezone
from typing import Any
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import Conversation, Message


def serialize_conversation(conv: Conversation, message_count: int = 0) -> dict[str, Any]:
    return {
        "id": str(conv.id),
        "session_id": conv.session_id,
        "title": conv.title,
        "active_location": conv.active_location,
        "active_date": conv.active_date,
        "language": conv.language,
        "user_type": conv.user_type,
        "created_at": conv.created_at.isoformat(),
        "updated_at": conv.updated_at.isoformat(),
        "message_count": message_count,
    }


def serialize_message(msg: Message) -> dict[str, Any]:
    return {
        "id": str(msg.id),
        "conversation_id": str(msg.conversation_id),
        "role": msg.role,
        "content": msg.content,
        "tool_calls": msg.tool_calls,
        "tool_call_id": msg.tool_call_id,
        "tool_name": msg.tool_name,
        "tool_result": msg.tool_result,
        "language": msg.language,
        "created_at": msg.created_at.isoformat(),
    }


async def list_conversations(db: AsyncSession, session_id: str) -> list[dict[str, Any]]:
    stmt = (
        select(
            Conversation,
            func.count(Message.id).label("msg_count"),
        )
        .outerjoin(
            Message,
            (Message.conversation_id == Conversation.id) & (Message.role.in_(["user", "assistant"])),
        )
        .where(Conversation.session_id == session_id)
        .group_by(Conversation.id)
        .order_by(Conversation.updated_at.desc())
    )
    rows = (await db.execute(stmt)).all()
    return [serialize_conversation(conv, int(count or 0)) for conv, count in rows]


async def create_conversation(
    db: AsyncSession,
    session_id: str = "demo-session",
    title: str = "New Weather Conversation",
    active_location: str | None = None,
    active_date: str | None = None,
    language: str = "en",
    user_type: str = "citizen",
) -> Conversation:
    conv = Conversation(
        session_id=session_id,
        title=title.strip() or "New Weather Conversation",
        active_location=active_location,
        active_date=active_date,
        language=language,
        user_type=user_type,
    )
    db.add(conv)
    await db.commit()
    await db.refresh(conv)
    return conv


async def get_conversation(db: AsyncSession, conversation_id: str) -> Conversation | None:
    try:
        uid = uuid.UUID(conversation_id)
    except ValueError:
        return None
    return await db.get(Conversation, uid)


async def update_conversation(
    db: AsyncSession,
    conversation_id: str,
    *,
    title: str | None = None,
    active_location: str | None = None,
    active_date: str | None = None,
    language: str | None = None,
    user_type: str | None = None,
) -> Conversation | None:
    conv = await get_conversation(db, conversation_id)
    if not conv:
        return None
    if title is not None:
        conv.title = title
    if active_location is not None:
        conv.active_location = active_location
    if active_date is not None:
        conv.active_date = active_date
    if language is not None:
        conv.language = language
    if user_type is not None:
        conv.user_type = user_type
    conv.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(conv)
    return conv


async def delete_conversation(db: AsyncSession, conversation_id: str) -> bool:
    conv = await get_conversation(db, conversation_id)
    if not conv:
        return False
    await db.delete(conv)
    await db.commit()
    return True


async def get_messages(db: AsyncSession, conversation_id: str) -> list[Message]:
    try:
        uid = uuid.UUID(conversation_id)
    except ValueError:
        return []
    stmt = select(Message).where(Message.conversation_id == uid).order_by(Message.created_at.asc())
    return list((await db.execute(stmt)).scalars().all())


async def append_message(
    db: AsyncSession,
    *,
    conversation_id: uuid.UUID,
    role: str,
    content: str = "",
    tool_calls: list[dict[str, Any]] | None = None,
    tool_call_id: str | None = None,
    tool_name: str | None = None,
    tool_result: Any = None,
    language: str = "en",
) -> Message:
    msg = Message(
        conversation_id=conversation_id,
        role=role,
        content=content,
        tool_calls=tool_calls,
        tool_call_id=tool_call_id,
        tool_name=tool_name,
        tool_result=tool_result,
        language=language,
    )
    db.add(msg)
    conv = await db.get(Conversation, conversation_id)
    if conv:
        conv.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(msg)
    return msg
