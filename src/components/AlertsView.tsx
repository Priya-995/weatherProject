import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ExternalLink,
  Info,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { getDict } from '../i18n/translations.ts';
import type {
  AlertLifecycleStatus,
  AlertsResponse,
  FloodPredictionResponse,
  LocationResult,
  OfficialAlert,
  UILanguageCode,
  UserRoleType,
} from '../types/weather.ts';
import { formatTimestamp } from '../utils/weatherFormat.ts';
import { FloodRiskPanel } from './FloodRiskPanel.tsx';
import { FormattedMessage } from './FormattedMessage.tsx';
import { SearchGroundingPanel } from './SearchGroundingPanel.tsx';

function getTodayIstDate(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

interface AlertsViewProps {
  selectedLocation: LocationResult;
  language: UILanguageCode;
  userType: UserRoleType;
  onAskAssistant?: (prompt: string) => void;
}

function severityTextClass(sev: OfficialAlert['severity']) {
  switch (sev) {
    case 'Red':
      return 'text-red-700 dark:text-red-400';
    case 'Orange':
      return 'text-amber-700 dark:text-amber-400';
    case 'Yellow':
      return 'text-yellow-700 dark:text-yellow-400';
    default:
      return 'text-sky-700 dark:text-sky-400';
  }
}

export function AlertsView({
  selectedLocation,
  language,
  userType,
  onAskAssistant,
}: AlertsViewProps) {
  const dict = getDict(language);
  const [data, setData] = useState<AlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | AlertLifecycleStatus>('all');
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [explainingId, setExplainingId] = useState<string | null>(null);
  const [explainErrors, setExplainErrors] = useState<Record<string, string>>({});
  const [floodDate, setFloodDate] = useState<string>(() => getTodayIstDate());
  const [floodPrediction, setFloodPrediction] = useState<FloodPredictionResponse | null>(null);
  const [floodLoading, setFloodLoading] = useState<boolean>(false);

  const loadAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        lat: String(selectedLocation.latitude),
        lon: String(selectedLocation.longitude),
        name: selectedLocation.name,
        country: selectedLocation.country,
      });
      if (selectedLocation.admin1) params.set('admin1', selectedLocation.admin1);
      if (selectedLocation.country_code) params.set('country_code', selectedLocation.country_code);
      const res = await fetch(`/api/alerts?${params.toString()}`);
      if (!res.ok) throw new Error('Unable to fetch alerts endpoint.');
      const json = (await res.json()) as AlertsResponse;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Alert check failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
    setExplanations({});
    setExplainErrors({});
  }, [selectedLocation.latitude, selectedLocation.longitude, selectedLocation.name]);

  // Clear cached AI explanations when language or role changes so next click regenerates in active language/role
  useEffect(() => {
    setExplanations({});
  }, [language, userType]);

  useEffect(() => {
    let cancelled = false;
    const loadFlood = async () => {
      setFloodLoading(true);
      try {
        const params = new URLSearchParams({
          district: selectedLocation.name,
          forecast_date: floodDate,
        });
        const res = await fetch(`/api/flood/predict?${params.toString()}`);
        if (res.ok && !cancelled) {
          setFloodPrediction((await res.json()) as FloodPredictionResponse);
        }
      } catch {
        if (!cancelled) setFloodPrediction(null);
      } finally {
        if (!cancelled) setFloodLoading(false);
      }
    };
    loadFlood();
    return () => {
      cancelled = true;
    };
  }, [selectedLocation.name, floodDate]);

  const handleExplainAlert = async (alert: OfficialAlert) => {
    setExplainingId(alert.id);
    setExplainErrors((prev) => {
      const next = { ...prev };
      delete next[alert.id];
      return next;
    });
    try {
      const res = await fetch('/api/alerts/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert, user_type: userType, language }),
      });
      const json = (await res.json()) as { explanation?: string; message?: string };
      if (!res.ok || !json.explanation) {
        throw new Error(json.message || 'Unable to generate explanation.');
      }
      setExplanations((prev) => ({ ...prev, [alert.id]: json.explanation! }));
    } catch (err) {
      setExplainErrors((prev) => ({
        ...prev,
        [alert.id]: err instanceof Error ? err.message : 'AI explanation failed.',
      }));
    } finally {
      setExplainingId(null);
    }
  };

  const filterByLifecycle = (list: OfficialAlert[]) =>
    statusFilter === 'all'
      ? list
      : list.filter((a) => (a.status || 'active') === statusFilter);

  const renderAlertRow = (alert: OfficialAlert) => {
    const statusText =
      alert.status === 'expired'
        ? dict.alerts.statusExpired
        : alert.status === 'upcoming'
        ? dict.alerts.statusUpcoming
        : dict.alerts.statusActive;
    const isExplaining = explainingId === alert.id;
    const aiText = explanations[alert.id];
    const aiErr = explainErrors[alert.id];

    return (
      <article key={alert.id} className="py-4 space-y-2.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {alert.title} — {alert.affected_area}
          </h4>
          <span className={`text-xs font-semibold ${severityTextClass(alert.severity)}`}>
            {dict.alerts.severityLabel}: {alert.severity} · {alert.event_type} · {statusText}
          </span>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2">
          <span>
            {dict.alerts.authorityLabel}: {alert.issuing_authority}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">CAP ID: {alert.id}</span>
          {alert.valid_from && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {dict.alerts.validFromLabel}: {alert.valid_from}
              </span>
            </>
          )}
          {alert.valid_until && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {dict.alerts.validUntilLabel}: {alert.valid_until}
              </span>
            </>
          )}
        </div>

        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {alert.description}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => handleExplainAlert(alert)}
            disabled={isExplaining}
            className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50/70 dark:bg-sky-950/30 px-3 py-1.5 text-xs font-medium text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-950/50 disabled:opacity-60 transition-colors whitespace-nowrap"
          >
            <Bot className="h-3.5 w-3.5" />
            <span>{isExplaining ? dict.alerts.explainingAi : dict.alerts.explainAiBtn}</span>
          </button>

          {alert.source_link && (
            <a
              href={alert.source_link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400 hover:underline whitespace-nowrap"
            >
              <span>{dict.alerts.verifySachet}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {aiErr && (
          <div className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-xs text-red-700 dark:text-red-300">
            {aiErr}
          </div>
        )}

        {aiText && (
          <div className="rounded-lg border border-sky-200 dark:border-sky-900/50 bg-slate-50 dark:bg-slate-950/60 p-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-sky-700 dark:text-sky-400">
              <span>
                {dict.alerts.aiExplanationHeader} · {dict.roles[userType].label}
              </span>
            </div>
            <div className="text-sm text-slate-800 dark:text-slate-200">
              <FormattedMessage content={aiText} />
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {dict.alerts.aiExplanationDisclaimer}
            </div>
          </div>
        )}
      </article>
    );
  };

  const localFiltered = data ? filterByLifecycle(data.official_alerts) : [];
  const nationalFiltered = data?.national_alerts ? filterByLifecycle(data.national_alerts) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {dict.alerts.heading} — {selectedLocation.name}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {dict.alerts.subheading}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Lifecycle Filter Tabs */}
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800">
            {(
              [
                ['all', dict.alerts.filterAll],
                ['active', dict.alerts.filterActive],
                ['upcoming', dict.alerts.filterUpcoming],
                ['expired', dict.alerts.filterExpired],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  statusFilter === key
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={loadAlerts}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{dict.alerts.checkFeedBtn}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/60 bg-white dark:bg-slate-900 p-5 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Official Government / IMD Warnings */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {dict.alerts.officialSectionTitle} · {selectedLocation.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {data?.official_feed_status.provider ||
                  'India Meteorological Department (IMD) / NDMA Sachet CAP Feed'}
              </p>
            </div>
          </div>

          {data && (
            <div className="text-xs font-medium flex items-center gap-1.5">
              {data.official_feed_status.status === 'available' ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-700 dark:text-emerald-400">
                    {dict.alerts.feedConnected}
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-amber-700 dark:text-amber-400">
                    {dict.alerts.feedUnavailable}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {loading && !data ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {dict.alerts.queryingFeed}
          </p>
        ) : data ? (
          <>
            <div className="text-xs text-slate-600 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span>{data.official_feed_status.message}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  {formatTimestamp(data.official_feed_status.checked_at, language)}
                </span>
                {typeof data.duplicates_removed === 'number' && data.duplicates_removed > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {data.duplicates_removed} {dict.alerts.dedupMeta}
                    </span>
                  </>
                )}
                {typeof data.expired_count === 'number' && data.expired_count > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {data.expired_count} {dict.alerts.expiredMeta}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <a
                  href="https://sachet.ndma.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:underline"
                >
                  <span>{dict.alerts.verifySachet}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
                <a
                  href="https://mausam.imd.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:underline"
                >
                  <span>{dict.alerts.imdMausam}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {localFiltered.length > 0 ? (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {localFiltered.map((alert) => renderAlertRow(alert))}
              </div>
            ) : (
              <div className="py-3 text-sm text-slate-600 dark:text-slate-400">
                {dict.alerts.noLocalWarnings}{' '}
                <strong className="text-slate-900 dark:text-slate-200">
                  {selectedLocation.name}
                  {selectedLocation.admin1 ? `, ${selectedLocation.admin1}` : ''}
                </strong>
                .
              </div>
            )}

            {nationalFiltered.length > 0 && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {dict.alerts.otherNationalTitle} ({nationalFiltered.length})
                </h4>
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {nationalFiltered.map((alert) => renderAlertRow(alert))}
                </div>
              </div>
            )}
          </>
        ) : null}
      </section>

      {/* Live Web & Bulletin Verification via Gemini 4 + Google Search Grounding */}
      <SearchGroundingPanel
        locationName={selectedLocation.name}
        uiLanguage={language}
        userType={userType}
        compact
      />

      {/* Derived Meteorological Advisories (Strictly Non-Official) */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200 dark:border-slate-800">
          <Info className="h-5 w-5 text-sky-600 dark:text-sky-400 shrink-0" />
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {dict.alerts.derivedSectionTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {dict.alerts.derivedSectionSub}
            </p>
          </div>
        </div>

        {data && data.advisories.length > 0 ? (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {data.advisories.map((adv) => (
              <article key={adv.id} className="py-4 space-y-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {adv.title}
                  </h4>
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                    {adv.severity} · {adv.event_type}
                  </span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300">{adv.summary}</p>
                <div className="text-xs text-slate-500 dark:text-slate-400">{adv.source}</div>
                <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  {adv.precautions.map((p, idx) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-400 py-2">
            {dict.alerts.noDerivedThresholds} {selectedLocation.name}.
          </p>
        )}
      </section>

      {/* Experimental 3-Day Flood ML Risk Outlook (Strictly Non-Official) */}
      <FloodRiskPanel
        prediction={floodPrediction}
        loading={floodLoading}
        language={language}
        userType={userType}
        forecastDate={floodDate}
        onChangeForecastDate={setFloodDate}
        onAskAssistant={onAskAssistant}
        showDateControl
      />
    </div>
  );
}
