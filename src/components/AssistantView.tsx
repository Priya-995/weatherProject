import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronRight,
  Database,
  Edit2,
  Globe,
  MessageSquarePlus,
  Mic,
  MicOff,
  Send,
  Trash2,
  Volume2,
  VolumeX,
  Wrench,
  X,
} from 'lucide-react';
import { getDict } from '../i18n/translations.ts';
import {
  SUPPORTED_LANGUAGES,
  type ChatMessageRecord,
  type ConversationRecord,
  type LocationResult,
  type SupportedLanguageCode,
  type UILanguageCode,
  type UserRoleType,
} from '../types/weather.ts';
import { formatTimestamp, getSessionId } from '../utils/weatherFormat.ts';
import { FormattedMessage } from './FormattedMessage.tsx';

interface AssistantViewProps {
  selectedLocation: LocationResult;
  uiLanguage: UILanguageCode;
  userType: UserRoleType;
  pendingPrompt: string | null;
  onConsumePendingPrompt: () => void;
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export function AssistantView({
  selectedLocation,
  uiLanguage,
  userType,
  pendingPrompt,
  onConsumePendingPrompt,
}: AssistantViewProps) {
  const dict = getDict(uiLanguage);
  const [sessionId] = useState<string>(() => getSessionId());
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationRecord | null>(null);
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const [language, setLanguage] = useState<SupportedLanguageCode>(uiLanguage);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [storageLabel, setStorageLabel] = useState<string>('PostgreSQL Persistent Store');
  const [groqConfigured, setGroqConfigured] = useState<boolean | null>(null);

  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [showFullAudit, setShowFullAudit] = useState(false);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});

  // Voice & TTS states
  const [listening, setListening] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync assistant reply language whenever global UI language changes
  useEffect(() => {
    setLanguage(uiLanguage);
  }, [uiLanguage]);

  const loadConversations = async (selectId?: string) => {
    setLoadingList(true);
    try {
      const [convRes, healthRes] = await Promise.all([
        fetch(`/api/conversations?session_id=${encodeURIComponent(sessionId)}`),
        fetch('/api/health'),
      ]);

      if (healthRes.ok) {
        const h = (await healthRes.json()) as {
          groq_configured?: boolean;
          storage?: { label?: string };
        };
        setGroqConfigured(Boolean(h.groq_configured));
        if (h.storage?.label) setStorageLabel(h.storage.label);
      }

      if (convRes.ok) {
        const data = (await convRes.json()) as {
          conversations: ConversationRecord[];
          storage?: { label?: string };
        };
        setConversations(data.conversations || []);
        if (data.storage?.label) setStorageLabel(data.storage.label);

        const targetId = selectId || activeConversation?.id || data.conversations?.[0]?.id;
        if (targetId) {
          await openConversation(targetId);
        } else {
          setActiveConversation(null);
          setMessages([]);
        }
      }
    } catch {
      setErrorMsg('Unable to load conversation history from server.');
    } finally {
      setLoadingList(false);
    }
  };

  const openConversation = async (id: string) => {
    try {
      const res = await fetch(`/api/conversations/${encodeURIComponent(id)}`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        conversation: ConversationRecord;
        messages: ChatMessageRecord[];
      };
      setActiveConversation(data.conversation);
      setMessages(data.messages || []);
      setErrorMsg(null);
    } catch {
      setErrorMsg('Failed to reopen selected conversation.');
    }
  };

  useEffect(() => {
    loadConversations();
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      recognitionRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, sending]);

  useEffect(() => {
    if (pendingPrompt) {
      setInput(pendingPrompt);
      onConsumePendingPrompt();
    }
  }, [pendingPrompt, onConsumePendingPrompt]);

  const handleNewChat = async () => {
    setErrorMsg(null);
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          title: 'New Weather Conversation',
          active_location: selectedLocation.name,
          language,
          user_type: userType,
        }),
      });
      if (!res.ok) throw new Error('Failed to create conversation');
      const data = (await res.json()) as { conversation: ConversationRecord };
      setConversations((prev) => [data.conversation, ...prev]);
      setActiveConversation(data.conversation);
      setMessages([]);
    } catch {
      setErrorMsg('Could not create a new conversation.');
    }
  };

  const handleRenameSubmit = async (id: string) => {
    const trimmed = editingTitle.trim();
    if (!trimmed) {
      setEditingConvId(null);
      return;
    }
    try {
      const res = await fetch(`/api/conversations/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      });
      if (res.ok) {
        const data = (await res.json()) as { conversation: ConversationRecord };
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, title: data.conversation.title } : c))
        );
        if (activeConversation?.id === id) {
          setActiveConversation(data.conversation);
        }
      }
    } finally {
      setEditingConvId(null);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      const res = await fetch(`/api/conversations/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const remaining = conversations.filter((c) => c.id !== id);
        setConversations(remaining);
        if (activeConversation?.id === id) {
          if (remaining[0]) {
            await openConversation(remaining[0].id);
          } else {
            setActiveConversation(null);
            setMessages([]);
          }
        }
      }
    } catch {
      setErrorMsg('Failed to delete conversation.');
    }
  };

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || sending) return;
    setErrorMsg(null);
    setSending(true);
    if (!overrideText) setInput('');

    const tempUserMsg: ChatMessageRecord = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConversation?.id || 'pending',
      role: 'user',
      content: text,
      language,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: activeConversation?.id || null,
          session_id: sessionId,
          message: text,
          language,
          user_type: userType,
          default_location: selectedLocation.name,
        }),
      });

      const payload = (await res.json()) as {
        conversation?: ConversationRecord;
        messages?: ChatMessageRecord[];
        error?: string;
        message?: string;
        detail?: { error?: string; message?: string } | string;
      };

      if (!res.ok) {
        const detailObj = typeof payload.detail === 'object' ? payload.detail : null;
        const msgText =
          payload.message ||
          detailObj?.message ||
          (typeof payload.detail === 'string' ? payload.detail : null) ||
          'WeatherGPT request failed.';
        if (payload.error === 'GROQ_API_KEY_MISSING' || detailObj?.error === 'GROQ_API_KEY_MISSING') {
          setGroqConfigured(false);
        }
        setErrorMsg(msgText);
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
        return;
      }

      if (payload.conversation) {
        setActiveConversation(payload.conversation);
        setConversations((prev) => {
          const exists = prev.some((c) => c.id === payload.conversation!.id);
          if (exists) {
            return [
              payload.conversation!,
              ...prev.filter((c) => c.id !== payload.conversation!.id),
            ];
          }
          return [payload.conversation!, ...prev];
        });
      }
      if (payload.messages) {
        setMessages(payload.messages);
      }
    } catch {
      setErrorMsg('Network error communicating with WeatherGPT server.');
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setSending(false);
    }
  };

  const toggleVoiceInput = () => {
    setVoiceNotice(null);
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRec) {
      setVoiceNotice('Speech recognition is not supported in this browser.');
      return;
    }

    const langObj = SUPPORTED_LANGUAGES.find((l) => l.code === language) ?? SUPPORTED_LANGUAGES[0];
    const rec = new SpeechRec();
    rec.lang = langObj.speechLocale;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript) {
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
      setListening(false);
    };
    rec.onerror = (ev) => {
      setListening(false);
      setVoiceNotice(`Microphone stopped (${ev.error}).`);
    };
    rec.onend = () => {
      setListening(false);
    };

    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  };

  const toggleSpeak = (msg: ChatMessageRecord) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setVoiceNotice('Text-to-speech is not supported in this browser.');
      return;
    }
    if (speakingMessageId === msg.id) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(msg.content);
    const langObj =
      SUPPORTED_LANGUAGES.find((l) => l.code === (msg.language || language)) ??
      SUPPORTED_LANGUAGES[0];
    utterance.lang = langObj.speechLocale;
    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);
    setSpeakingMessageId(msg.id);
    window.speechSynthesis.speak(utterance);
  };

  const visibleMessages = showFullAudit
    ? messages
    : messages.filter((m) => {
        if (m.role === 'user') return true;
        if (m.role === 'assistant' && m.content.trim().length > 0) return true;
        if (m.role === 'tool') return true;
        return false;
      });

  const samplePrompts = dict.assistant.samplePromptsByRole[userType];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-11rem)] min-h-[600px]">
      {/* Left Conversation History Panel */}
      <aside className="lg:col-span-4 xl:col-span-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {dict.assistant.conversations}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
              <Database className="h-3 w-3 shrink-0" />
              <span className="truncate">{storageLabel}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleNewChat}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700 transition-colors whitespace-nowrap shrink-0"
          >
            <MessageSquarePlus className="h-3.5 w-3.5" />
            <span>{dict.assistant.newChat}</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
          {loadingList ? (
            <div className="p-4 text-xs text-slate-500 dark:text-slate-400">
              {dict.assistant.loadingConvs}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center space-y-2">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {dict.assistant.noConvsTitle}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {dict.assistant.noConvsBody}
              </p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = activeConversation?.id === conv.id;
              const isEditing = editingConvId === conv.id;

              return (
                <div
                  key={conv.id}
                  className={`p-3.5 transition-colors ${
                    isActive
                      ? 'bg-sky-50/80 dark:bg-sky-950/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameSubmit(conv.id);
                          if (e.key === 'Escape') setEditingConvId(null);
                        }}
                        autoFocus
                        className="flex-1 min-w-0 rounded border border-sky-500 bg-white dark:bg-slate-950 px-2 py-1 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRenameSubmit(conv.id)}
                        aria-label="Save"
                        className="p-1 text-emerald-600 hover:text-emerald-700"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingConvId(null)}
                        aria-label="Cancel"
                        className="p-1 text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => openConversation(conv.id)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {conv.title}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          <span>{conv.active_location || dict.assistant.anyLocation}</span>
                          {conv.active_date && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums">{conv.active_date}</span>
                            </>
                          )}
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            {formatTimestamp(conv.updated_at, uiLanguage)}
                          </span>
                        </div>
                      </button>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingConvId(conv.id);
                            setEditingTitle(conv.title);
                          }}
                          aria-label={`Rename ${conv.title}`}
                          className="p-1.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteConversation(conv.id)}
                          aria-label={`Delete ${conv.title}`}
                          className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Main WeatherGPT Chat Workspace */}
      <section className="lg:col-span-8 xl:col-span-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
              {activeConversation?.title || dict.nav.assistant}
            </h2>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
              <span>
                {dict.assistant.roleContextBadge}: {dict.roles[userType].label}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {dict.assistant.contextLabel}:{' '}
                {activeConversation?.active_location || selectedLocation.name}
                {activeConversation?.active_date ? ` · ${activeConversation.active_date}` : ''}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowFullAudit((v) => !v)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
                showFullAudit
                  ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {showFullAudit ? dict.assistant.hideRoles : dict.assistant.inspectRoles}
            </button>

            <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
              <Globe className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as SupportedLanguageCode)}
                aria-label={dict.common.languageLabel}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name} ({lang.nativeName})
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {groqConfigured === false && (
          <div className="mx-5 mt-4 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div>
              <span className="font-semibold">{dict.assistant.groqMissingTitle}</span>{' '}
              {dict.assistant.groqMissingBody}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {visibleMessages.length === 0 ? (
            <div className="max-w-2xl mx-auto py-8 space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {dict.assistant.emptyHeading}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {dict.assistant.emptySub}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {samplePrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSend(prompt)}
                    className="text-left rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 px-3.5 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-sky-400 hover:bg-sky-50/50 dark:hover:bg-sky-950/20 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            visibleMessages.map((msg) => {
              if (msg.role === 'system') {
                return (
                  <div
                    key={msg.id}
                    className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-xs text-slate-600 dark:text-slate-400"
                  >
                    <div className="font-mono font-semibold text-slate-500 mb-1">
                      role: system
                    </div>
                    <pre className="whitespace-pre-wrap font-sans leading-relaxed">{msg.content}</pre>
                  </div>
                );
              }

              if (msg.role === 'tool') {
                const isExpanded = Boolean(expandedTools[msg.id]);
                return (
                  <div
                    key={msg.id}
                    className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 px-3.5 py-2 text-xs"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedTools((prev) => ({ ...prev, [msg.id]: !prev[msg.id] }))
                      }
                      className="w-full flex items-center justify-between gap-2 text-slate-600 dark:text-slate-300"
                    >
                      <span className="flex items-center gap-2 font-mono">
                        <Wrench className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                        <span>
                          {dict.assistant.toolResultLabel}: <strong>{msg.tool_name}</strong>
                        </span>
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </button>
                    {isExpanded && (
                      <pre className="mt-2 max-h-56 overflow-auto rounded bg-slate-900 text-slate-100 p-2.5 text-[11px] font-mono">
                        {JSON.stringify(msg.tool_result ?? msg.content, null, 2)}
                      </pre>
                    )}
                  </div>
                );
              }

              if (msg.role === 'assistant' && (!msg.content || !msg.content.trim()) && msg.tool_calls) {
                return (
                  <div
                    key={msg.id}
                    className="text-xs font-mono text-slate-500 dark:text-slate-400 px-1"
                  >
                    role: assistant · {msg.tool_calls.map((t) => t.name).join(', ')}
                  </div>
                );
              }

              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                      isUser
                        ? 'bg-sky-600 text-white'
                        : 'border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {isUser ? (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    ) : (
                      <FormattedMessage content={msg.content} />
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400 px-1">
                    <span className="font-mono tabular-nums">
                      {formatTimestamp(msg.created_at, uiLanguage)}
                    </span>
                    {!isUser && (
                      <button
                        type="button"
                        onClick={() => toggleSpeak(msg)}
                        className="inline-flex items-center gap-1 text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                      >
                        {speakingMessageId === msg.id ? (
                          <>
                            <VolumeX className="h-3 w-3" />
                            <span>{dict.assistant.stop}</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="h-3 w-3" />
                            <span>{dict.assistant.listen}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {sending && (
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {dict.assistant.thinking}
            </div>
          )}

          {errorMsg && (
            <div className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 px-4 py-2.5 text-xs text-red-700 dark:text-red-300">
              {errorMsg}
            </div>
          )}

          {voiceNotice && (
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-xs text-slate-600 dark:text-slate-400">
              {voiceNotice}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2.5"
        >
          <button
            type="button"
            onClick={toggleVoiceInput}
            aria-label={listening ? dict.assistant.stopVoiceHint : dict.assistant.speakHint}
            title={listening ? dict.assistant.stopVoiceHint : dict.assistant.speakHint}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border transition-colors shrink-0 ${
              listening
                ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-600'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`${dict.assistant.inputPlaceholder} ${
              SUPPORTED_LANGUAGES.find((l) => l.code === language)?.nativeName || 'English'
            }...`}
            className="flex-1 min-w-0 h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-sky-500"
          />

          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0"
          >
            <Send className="h-4 w-4" />
            <span>{dict.assistant.send}</span>
          </button>
        </form>
      </section>
    </div>
  );
}
