-- PostgreSQL schema for WeatherGPT persistent conversation history

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(128) NOT NULL DEFAULT 'demo-session',
    title VARCHAR(255) NOT NULL DEFAULT 'New Weather Conversation',
    active_location VARCHAR(160),
    active_date VARCHAR(32),
    language VARCHAR(16) NOT NULL DEFAULT 'en',
    user_type VARCHAR(32) NOT NULL DEFAULT 'citizen',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_session_updated
    ON conversations (session_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(24) NOT NULL CHECK (role IN ('system', 'user', 'assistant', 'tool')),
    content TEXT NOT NULL DEFAULT '',
    tool_calls JSONB,
    tool_call_id VARCHAR(128),
    tool_name VARCHAR(128),
    tool_result JSONB,
    language VARCHAR(16) NOT NULL DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
    ON messages (conversation_id, created_at ASC);
