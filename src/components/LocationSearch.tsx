import { useEffect, useRef, useState } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import { getDict } from '../i18n/translations.ts';
import type { LocationResult, UILanguageCode } from '../types/weather.ts';

interface LocationSearchProps {
  selectedLocation: LocationResult;
  onSelectLocation: (loc: LocationResult) => void;
  language?: UILanguageCode;
  placeholder?: string;
}

export function LocationSearch({
  selectedLocation,
  onSelectLocation,
  language = 'en',
  placeholder,
}: LocationSearchProps) {
  const dict = getDict(language);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/locations/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = (await res.json()) as { results: LocationResult[] };
          setResults(data.results || []);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => clearTimeout(timer);
  }, [query, open]);

  const effectivePlaceholder = placeholder ?? dict.common.searchPlaceholder;

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 focus-within:ring-2 focus-within:ring-sky-500/40 focus-within:border-sky-500 transition-colors">
        <Search className="h-4 w-4 text-slate-400 shrink-0" />
        <input
          type="text"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          placeholder={`${selectedLocation.name}${selectedLocation.admin1 ? `, ${selectedLocation.admin1}` : ''} — ${effectivePlaceholder}`}
          aria-label={effectivePlaceholder}
          className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-80 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg">
          <div className="px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
            {query.trim() ? dict.common.matchingLocations : dict.common.quickStations}
          </div>
          {loading ? (
            <div className="px-3 py-4 text-sm text-slate-500 dark:text-slate-400">
              {dict.common.searchingLocations}
            </div>
          ) : results.length === 0 ? (
            <div className="px-3 py-4 text-sm text-slate-500 dark:text-slate-400">
              {dict.common.noMatchingLocations}
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {results.map((loc, idx) => (
                <li key={`${loc.name}-${loc.latitude}-${idx}`}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectLocation(loc);
                      setQuery('');
                      setOpen(false);
                    }}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <MapPin className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
                      <div className="truncate">
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {loc.name}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">
                          {[loc.admin1, loc.country].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-mono tabular-nums text-slate-400 shrink-0">
                      {loc.latitude.toFixed(2)}, {loc.longitude.toFixed(2)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
