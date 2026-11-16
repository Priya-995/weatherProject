import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';
import type {
  ChatMessageRecord,
  ConversationRecord,
  SupportedLanguageCode,
  ToolCallRecord,
  UserRoleType,
} from '../src/types/weather.ts';

const FALLBACK_DB_PATH = process.env.CHAT_STORE_PATH || path.join('/tmp', 'weathergpt_store.json');

interface StoreSchema {
  conversations: ConversationRecord[];
  messages: ChatMessageRecord[];
}

export class ChatRepository {
  private pool: Pool | null = null;
  private initialized = false;
  private storageMode: 'postgresql' | 'local_file' = 'local_file';

  constructor() {
    const dbUrl = process.env.DATABASE_URL?.trim();
    if (dbUrl) {
      this.pool = new Pool({
        connectionString: dbUrl,
        connectionTimeoutMillis: 5000,
      });
      this.storageMode = 'postgresql';
    }
  }

  getStorageInfo(): { mode: 'postgresql' | 'local_file'; label: string } {
    return this.storageMode === 'postgresql'
      ? { mode: 'postgresql', label: 'PostgreSQL Persistent Store' }
      : { mode: 'local_file', label: 'Local Persistent Store (PostgreSQL ready via DATABASE_URL)' };
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    if (this.pool) {
      try {
        await this.pool.query(`
          CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            title TEXT NOT NULL,
            active_location TEXT,
            active_date TEXT,
            language TEXT NOT NULL DEFAULT 'en',
            user_type TEXT NOT NULL DEFAULT 'citizen',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );

          ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user_type TEXT NOT NULL DEFAULT 'citizen';

          CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
            role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant', 'tool')),
            content TEXT NOT NULL DEFAULT '',
            tool_calls JSONB,
            tool_call_id TEXT,
            tool_name TEXT,
            tool_result JSONB,
            language TEXT DEFAULT 'en',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );

          CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
            ON messages (conversation_id, created_at ASC);
        `);
        this.storageMode = 'postgresql';
        this.initialized = true;
        return;
      } catch (err) {
        console.warn('PostgreSQL initialization failed, falling back to local persistent file store:', err);
        this.pool = null;
        this.storageMode = 'local_file';
      }
    }

    if (!fs.existsSync(FALLBACK_DB_PATH)) {
      fs.writeFileSync(FALLBACK_DB_PATH, JSON.stringify({ conversations: [], messages: [] }, null, 2), 'utf8');
    }
    this.initialized = true;
  }

  private readLocal(): StoreSchema {
    try {
      if (!fs.existsSync(FALLBACK_DB_PATH)) {
        return { conversations: [], messages: [] };
      }
      const raw = fs.readFileSync(FALLBACK_DB_PATH, 'utf8');
      const parsed = JSON.parse(raw) as StoreSchema;
      return {
        conversations: Array.isArray(parsed.conversations) ? parsed.conversations : [],
        messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      };
    } catch {
      return { conversations: [], messages: [] };
    }
  }

  private writeLocal(data: StoreSchema): void {
    const tmp = `${FALLBACK_DB_PATH}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tmp, FALLBACK_DB_PATH);
  }

  async listConversations(sessionId: string): Promise<ConversationRecord[]> {
    await this.init();
    if (this.pool) {
      const res = await this.pool.query(
        `SELECT c.*, COUNT(m.id)::int AS message_count
         FROM conversations c
         LEFT JOIN messages m ON m.conversation_id = c.id AND m.role IN ('user', 'assistant')
         WHERE c.session_id = $1
         GROUP BY c.id
         ORDER BY c.updated_at DESC`,
        [sessionId]
      );
      return res.rows.map((r) => ({
        id: r.id,
        session_id: r.session_id,
        title: r.title,
        active_location: r.active_location,
        active_date: r.active_date,
        language: (r.language || 'en') as SupportedLanguageCode,
        user_type: (r.user_type || 'citizen') as UserRoleType,
        created_at: new Date(r.created_at).toISOString(),
        updated_at: new Date(r.updated_at).toISOString(),
        message_count: Number(r.message_count ?? 0),
      }));
    }

    const store = this.readLocal();
    return store.conversations
      .filter((c) => c.session_id === sessionId)
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      .map((c) => ({
        ...c,
        user_type: c.user_type ?? 'citizen',
        message_count: store.messages.filter(
          (m) => m.conversation_id === c.id && (m.role === 'user' || m.role === 'assistant')
        ).length,
      }));
  }

  async createConversation(params: {
    sessionId: string;
    title?: string;
    activeLocation?: string | null;
    activeDate?: string | null;
    language?: SupportedLanguageCode;
    userType?: UserRoleType;
  }): Promise<ConversationRecord> {
    await this.init();
    const now = new Date().toISOString();
    const record: ConversationRecord = {
      id: randomUUID(),
      session_id: params.sessionId,
      title: params.title?.trim() || 'New Weather Conversation',
      active_location: params.activeLocation ?? null,
      active_date: params.activeDate ?? null,
      language: params.language ?? 'en',
      user_type: params.userType ?? 'citizen',
      created_at: now,
      updated_at: now,
      message_count: 0,
    };

    if (this.pool) {
      await this.pool.query(
        `INSERT INTO conversations (id, session_id, title, active_location, active_date, language, user_type, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          record.id,
          record.session_id,
          record.title,
          record.active_location,
          record.active_date,
          record.language,
          record.user_type,
          record.created_at,
          record.updated_at,
        ]
      );
      return record;
    }

    const store = this.readLocal();
    store.conversations.unshift(record);
    this.writeLocal(store);
    return record;
  }

  async getConversation(id: string): Promise<ConversationRecord | null> {
    await this.init();
    if (this.pool) {
      const res = await this.pool.query(`SELECT * FROM conversations WHERE id = $1`, [id]);
      if (res.rows.length === 0) return null;
      const r = res.rows[0];
      return {
        id: r.id,
        session_id: r.session_id,
        title: r.title,
        active_location: r.active_location,
        active_date: r.active_date,
        language: (r.language || 'en') as SupportedLanguageCode,
        user_type: (r.user_type || 'citizen') as UserRoleType,
        created_at: new Date(r.created_at).toISOString(),
        updated_at: new Date(r.updated_at).toISOString(),
      };
    }

    const store = this.readLocal();
    return store.conversations.find((c) => c.id === id) ?? null;
  }

  async updateConversation(
    id: string,
    patch: Partial<Pick<ConversationRecord, 'title' | 'active_location' | 'active_date' | 'language' | 'user_type'>>
  ): Promise<ConversationRecord | null> {
    await this.init();
    const now = new Date().toISOString();

    if (this.pool) {
      const existing = await this.getConversation(id);
      if (!existing) return null;
      const next = {
        title: patch.title !== undefined ? patch.title : existing.title,
        active_location: patch.active_location !== undefined ? patch.active_location : existing.active_location,
        active_date: patch.active_date !== undefined ? patch.active_date : existing.active_date,
        language: patch.language !== undefined ? patch.language : existing.language,
        user_type: patch.user_type !== undefined ? patch.user_type : existing.user_type ?? 'citizen',
      };
      await this.pool.query(
        `UPDATE conversations
         SET title = $2, active_location = $3, active_date = $4, language = $5, user_type = $6, updated_at = $7
         WHERE id = $1`,
        [id, next.title, next.active_location, next.active_date, next.language, next.user_type, now]
      );
      return { ...existing, ...next, updated_at: now };
    }

    const store = this.readLocal();
    const idx = store.conversations.findIndex((c) => c.id === id);
    if (idx < 0) return null;
    store.conversations[idx] = {
      ...store.conversations[idx],
      ...patch,
      updated_at: now,
    };
    this.writeLocal(store);
    return store.conversations[idx];
  }

  async deleteConversation(id: string): Promise<boolean> {
    await this.init();
    if (this.pool) {
      const res = await this.pool.query(`DELETE FROM conversations WHERE id = $1`, [id]);
      return (res.rowCount ?? 0) > 0;
    }

    const store = this.readLocal();
    const before = store.conversations.length;
    store.conversations = store.conversations.filter((c) => c.id !== id);
    store.messages = store.messages.filter((m) => m.conversation_id !== id);
    this.writeLocal(store);
    return store.conversations.length < before;
  }

  async getMessages(conversationId: string): Promise<ChatMessageRecord[]> {
    await this.init();
    if (this.pool) {
      const res = await this.pool.query(
        `SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
        [conversationId]
      );
      return res.rows.map((r) => ({
        id: r.id,
        conversation_id: r.conversation_id,
        role: r.role,
        content: r.content,
        tool_calls: r.tool_calls ?? null,
        tool_call_id: r.tool_call_id ?? null,
        tool_name: r.tool_name ?? null,
        tool_result: r.tool_result ?? null,
        language: (r.language || 'en') as SupportedLanguageCode,
        created_at: new Date(r.created_at).toISOString(),
      }));
    }

    const store = this.readLocal();
    return store.messages
      .filter((m) => m.conversation_id === conversationId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  }

  async appendMessage(params: {
    conversation_id: string;
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    tool_calls?: ToolCallRecord[] | null;
    tool_call_id?: string | null;
    tool_name?: string | null;
    tool_result?: unknown;
    language?: SupportedLanguageCode;
  }): Promise<ChatMessageRecord> {
    await this.init();
    const now = new Date().toISOString();
    const msg: ChatMessageRecord = {
      id: randomUUID(),
      conversation_id: params.conversation_id,
      role: params.role,
      content: params.content,
      tool_calls: params.tool_calls ?? null,
      tool_call_id: params.tool_call_id ?? null,
      tool_name: params.tool_name ?? null,
      tool_result: params.tool_result ?? null,
      language: params.language ?? 'en',
      created_at: now,
    };

    if (this.pool) {
      await this.pool.query(
        `INSERT INTO messages (id, conversation_id, role, content, tool_calls, tool_call_id, tool_name, tool_result, language, created_at)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8::jsonb, $9, $10)`,
        [
          msg.id,
          msg.conversation_id,
          msg.role,
          msg.content,
          msg.tool_calls ? JSON.stringify(msg.tool_calls) : null,
          msg.tool_call_id,
          msg.tool_name,
          msg.tool_result !== undefined && msg.tool_result !== null
            ? JSON.stringify(msg.tool_result)
            : null,
          msg.language,
          msg.created_at,
        ]
      );
      await this.pool.query(`UPDATE conversations SET updated_at = $2 WHERE id = $1`, [
        msg.conversation_id,
        now,
      ]);
      return msg;
    }

    const store = this.readLocal();
    store.messages.push(msg);
    const cIdx = store.conversations.findIndex((c) => c.id === msg.conversation_id);
    if (cIdx >= 0) {
      store.conversations[cIdx].updated_at = now;
    }
    this.writeLocal(store);
    return msg;
  }
}

export const chatRepo = new ChatRepository();
