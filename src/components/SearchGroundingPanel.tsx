import { useState } from 'react';
import { ExternalLink, Globe, Loader2, Search } from 'lucide-react';
import { getFeatureDict } from '../i18n/featureTranslations.ts';
import type {
  SearchGroundingResponse,
  SupportedLanguageCode,
  UILanguageCode,
  UserRoleType,
} from '../types/weather.ts';
import { FormattedMessage } from './FormattedMessage.tsx';

interface SearchGroundingPanelProps {
  locationName: string;
  uiLanguage: UILanguageCode;
  replyLanguage?: SupportedLanguageCode;
  userType: UserRoleType;
  defaultQuery?: string;
  compact?: boolean;
}

export function SearchGroundingPanel({
  locationName,
  uiLanguage,
  replyLanguage,
  userType,
  defaultQuery = '',
  compact = false,
}: SearchGroundingPanelProps) {
  const fDict = getFeatureDict(uiLanguage).searchGrounding;
  const [query, setQuery] = useState(defaultQuery);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SearchGroundingResponse | null>(null);

  const runSearch = async (overrideQuery?: string) => {
    const q = (overrideQuery ?? query).trim();
    if (!q || loading) return;
    if (overrideQuery) setQuery(overrideQuery);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/search-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          location: locationName,
          language: replyLanguage ?? uiLanguage,
          user_type: userType,
        }),
      });
      const json = (await res.json()) as SearchGroundingResponse & { message?: string };
      if (!res.ok) {
        throw new Error(json.message || 'Google Search Grounding request failed.');
      }
      setResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reach Search Grounding service.');
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = fDict.quickPromptsByRole[userType].map((tpl) =>
    tpl.replace(/\{city\}/g, locationName)
  );

  return (
    <div
      className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${
        compact ? 'p-4 space-y-3' : 'p-5 space-y-4'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {fDict.title}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{fDict.subtitle}</p>
        </div>
        <span className="text-[11px] font-mono text-sky-700 dark:text-sky-400 shrink-0">
          {fDict.modelBadge}
        </span>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          runSearch();
        }}
        className="flex flex-wrap sm:flex-nowrap items-center gap-2"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={fDict.placeholder}
          className="flex-1 min-w-0 h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-sky-500"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Search className="h-3.5 w-3.5" />
          )}
          <span>{loading ? fDict.searching : fDict.searchBtn}</span>
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            disabled={loading}
            onClick={() => runSearch(prompt)}
            className="text-left rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:border-sky-400 hover:bg-sky-50/50 dark:hover:bg-sky-950/30 transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 px-3.5 py-2.5 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 p-4 space-y-3">
          <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
            <FormattedMessage content={result.answer} />
          </div>

          {result.web_search_queries.length > 0 && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="font-semibold">{fDict.queriesTitle}: </span>
              <span className="font-mono">{result.web_search_queries.join(' · ')}</span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {fDict.sourcesTitle}
            </div>
            {result.sources.length > 0 ? (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {result.sources.map((src) => (
                  <li key={src.uri}>
                    <a
                      href={src.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400 hover:underline truncate"
                    >
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      <span className="truncate">{src.title}</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">{fDict.noSources}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
