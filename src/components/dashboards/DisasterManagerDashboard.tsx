import {
  AlertTriangle,
  Clock,
  ExternalLink,
  MapPin,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { getDict, translateCondition } from '../../i18n/translations.ts';
import type {
  AlertsResponse,
  FloodPredictionResponse,
  LocationResult,
  MapStationPoint,
  NormalizedWeatherResponse,
  OfficialAlert,
  UILanguageCode,
} from '../../types/weather.ts';
import { formatTemp, formatTimestamp, type TempUnit } from '../../utils/weatherFormat.ts';
import { FloodRiskPanel } from '../FloodRiskPanel.tsx';
import { RegionalFloodTable } from '../RegionalFloodTable.tsx';

interface DisasterManagerDashboardProps {
  weather: NormalizedWeatherResponse;
  alerts: AlertsResponse | null;
  stations: MapStationPoint[];
  floodPrediction: FloodPredictionResponse | null;
  floodLoading: boolean;
  floodDate: string;
  onChangeFloodDate: (dateStr: string) => void;
  loading: boolean;
  unit: TempUnit;
  language: UILanguageCode;
  onRefresh: () => void;
  onSelectLocation: (loc: LocationResult) => void;
  onAskAssistant: (prompt: string) => void;
  onOpenAlerts: () => void;
}

export function DisasterManagerDashboard({
  weather,
  alerts,
  stations,
  floodPrediction,
  floodLoading,
  floodDate,
  onChangeFloodDate,
  loading,
  unit,
  language,
  onRefresh,
  onSelectLocation,
  onAskAssistant,
  onOpenAlerts,
}: DisasterManagerDashboardProps) {
  const dict = getDict(language);
  const allOfficial: OfficialAlert[] = [
    ...(alerts?.official_alerts || []),
    ...(alerts?.national_alerts || []),
  ];

  const severeWarnings = allOfficial.filter(
    (a) => a.severity === 'Red' || a.severity === 'Orange'
  );
  const cycloneOrRainSignals = allOfficial.filter(
    (a) =>
      a.event_type === 'Cyclone' ||
      a.event_type === 'Heavy Rainfall' ||
      a.event_type === 'Thunderstorm'
  );
  const uniqueAffectedAreas = Array.from(
    new Set(allOfficial.map((a) => a.affected_state || a.affected_area))
  ).slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Operational Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ShieldAlert className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
            <span>{dict.roles.disaster.dashboardHeading}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {dict.common.updated} {formatTimestamp(weather.last_updated, language)}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {dict.disaster.opsTitle}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {dict.disaster.opsSub}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenAlerts}
            className="rounded-lg bg-red-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors whitespace-nowrap shrink-0"
          >
            {dict.disaster.viewAllAlertsBtn}
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{dict.common.refresh}</span>
          </button>
        </div>
      </div>

      {/* Operational KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-1">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {dict.disaster.activeSevereCount}
          </div>
          <div className="text-3xl font-bold font-mono tabular-nums text-red-600 dark:text-red-400">
            {severeWarnings.length}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-1">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {dict.disaster.highRiskZones}
          </div>
          <div className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {uniqueAffectedAreas.length}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-1">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {dict.disaster.cycloneHeavyRainTitle}
          </div>
          <div className="text-3xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
            {cycloneOrRainSignals.length}
          </div>
        </div>
      </div>

      {/* Central 3-Day Flood ML Risk Outlook & UP 14-District Matrix */}
      <FloodRiskPanel
        prediction={floodPrediction}
        loading={floodLoading}
        language={language}
        userType="disaster"
        forecastDate={floodDate}
        onChangeForecastDate={onChangeFloodDate}
        onAskAssistant={onAskAssistant}
        showDateControl
      />

      <RegionalFloodTable
        forecastDate={floodDate}
        language={language}
        activeDistrictName={weather.location.name}
        onSelectLocation={onSelectLocation}
      />

      {/* Warning Timelines + Cyclone/Heavy Rain Signals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <section className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-red-600 dark:text-red-400" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {dict.disaster.warningTimelineTitle}
              </h3>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {dict.common.officialSourceNote}
            </span>
          </div>

          {allOfficial.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
              {allOfficial.slice(0, 8).map((a) => (
                <article key={a.id} className="py-3 space-y-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {a.title} — {a.affected_area}
                    </h4>
                    <span
                      className={`text-xs font-semibold ${
                        a.severity === 'Red'
                          ? 'text-red-600 dark:text-red-400'
                          : a.severity === 'Orange'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-sky-600 dark:text-sky-400'
                      }`}
                    >
                      {a.severity} · {a.event_type}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                    {a.issuing_authority}
                    {a.valid_from ? ` · ${dict.alerts.validFromLabel}: ${a.valid_from}` : ''}
                    {a.valid_until ? ` · ${dict.alerts.validUntilLabel}: ${a.valid_until}` : ''}
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {a.description}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-400 py-4">
              {dict.disaster.cycloneHeavyRainNone}
            </p>
          )}
        </section>

        {/* Preparedness Guidance (Explicitly Non-Official) + Official Portal Links */}
        <section className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {dict.disaster.preparednessTitle}
              </h3>
            </div>
            <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/20 px-3 py-2 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{dict.disaster.preparednessDisclaimer}</span>
            </div>
            <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed">
              <li>{dict.disaster.prepItem1}</li>
              <li>{dict.disaster.prepItem2}</li>
              <li>{dict.disaster.prepItem3}</li>
              <li>{dict.disaster.prepItem4}</li>
            </ul>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {dict.disaster.officialLinksTitle}
            </h4>
            <div className="space-y-1.5">
              <a
                href="https://sachet.ndma.gov.in"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline py-1"
              >
                <span>{dict.disaster.linkSachet}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="https://mausam.imd.gov.in"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline py-1"
              >
                <span>{dict.disaster.linkImd}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="https://ffs.india-water.gov.in"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline py-1"
              >
                <span>{dict.disaster.linkCwc}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* Geographic Distribution Matrix Across National Monitoring Hubs */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {dict.disaster.affectedAreasTitle}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {stations.slice(0, 8).map((st) => (
            <button
              key={st.location.name}
              type="button"
              onClick={() => onSelectLocation(st.location)}
              className="text-left rounded-lg border border-slate-200 dark:border-slate-800 p-3.5 hover:border-sky-500 transition-colors space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 truncate">
                  <MapPin className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                  <span className="truncate">{st.location.name}</span>
                </span>
                <span className="text-sm font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                  {formatTemp(st.temperature_c, unit, 0)}
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {translateCondition(st.condition_label, language)} · {st.wind_speed_kmh.toFixed(0)} km/h
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
