import { useEffect, useState } from 'react';
import {
  Building2,
  ExternalLink,
  MapPin,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { INDIA_STATE_DISTRICTS } from '../../data/indiaRegions.ts';
import { getDict, translateCondition } from '../../i18n/translations.ts';
import type {
  FloodPredictionResponse,
  LocationResult,
  RegionalOverviewResponse,
  UILanguageCode,
} from '../../types/weather.ts';
import {
  convertTemp,
  formatTemp,
  formatTimestamp,
  type TempUnit,
} from '../../utils/weatherFormat.ts';
import { FloodRiskPanel } from '../FloodRiskPanel.tsx';
import { RegionalFloodTable } from '../RegionalFloodTable.tsx';

interface GovernmentDashboardProps {
  selectedLocation: LocationResult;
  floodPrediction: FloodPredictionResponse | null;
  floodLoading: boolean;
  floodDate: string;
  onChangeFloodDate: (dateStr: string) => void;
  unit: TempUnit;
  language: UILanguageCode;
  onSelectLocation: (loc: LocationResult) => void;
  onAskAssistant: (prompt: string) => void;
  onOpenAlerts: () => void;
}

export function GovernmentDashboard({
  selectedLocation,
  floodPrediction,
  floodLoading,
  floodDate,
  onChangeFloodDate,
  unit,
  language,
  onSelectLocation,
  onAskAssistant,
  onOpenAlerts,
}: GovernmentDashboardProps) {
  const dict = getDict(language);
  const initialState =
    INDIA_STATE_DISTRICTS.find(
      (s) => s.state.toLowerCase() === (selectedLocation.admin1 || '').toLowerCase()
    )?.state || INDIA_STATE_DISTRICTS[0].state;

  const [selectedState, setSelectedState] = useState<string>(initialState);
  const [data, setData] = useState<RegionalOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const matched = INDIA_STATE_DISTRICTS.find(
      (s) => s.state.toLowerCase() === (selectedLocation.admin1 || '').toLowerCase()
    );
    if (matched) {
      setSelectedState(matched.state);
    }
  }, [selectedLocation.admin1]);

  const loadStateOverview = async (stateName: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/regional?state=${encodeURIComponent(stateName)}`);
      if (!res.ok) throw new Error('Unable to load state-level regional overview.');
      const json = (await res.json()) as RegionalOverviewResponse;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Regional overview failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStateOverview(selectedState);
  }, [selectedState]);

  const districts = data?.districts || [];
  const avgTempC =
    districts.length > 0
      ? districts.reduce((s, d) => s + d.temperature_c, 0) / districts.length
      : 0;
  const peakRainProb =
    districts.length > 0
      ? Math.max(...districts.map((d) => d.rain_probability_percent ?? 0))
      : 0;

  const chartData = districts.map((d) => ({
    name: d.location.name,
    temp: Number(convertTemp(d.temperature_c, unit).toFixed(1)),
    rainProb: d.rain_probability_percent ?? 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header + State Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Building2 className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
            <span>{dict.roles.government.dashboardHeading}</span>
            {data && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  {dict.common.updated} {formatTimestamp(data.last_updated, language)}
                </span>
              </>
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {dict.government.overviewTitle} — {selectedState}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {dict.government.overviewSub}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
            <span>{dict.government.selectState}:</span>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
            >
              {INDIA_STATE_DISTRICTS.map((s) => (
                <option key={s.state} value={s.state}>
                  {s.state}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => loadStateOverview(selectedState)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{dict.common.refresh}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/60 bg-white dark:bg-slate-900 p-4 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-1">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {dict.government.districtsMonitored}
          </div>
          <div className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {districts.length}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-1">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {dict.government.activeStateWarnings}
          </div>
          <div className="text-3xl font-bold font-mono tabular-nums text-red-600 dark:text-red-400">
            {data?.state_alerts.length ?? 0}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-1">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {dict.government.avgStateTemp}
          </div>
          <div className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {districts.length > 0 ? formatTemp(avgTempC, unit, 1) : '—'}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-1">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {dict.government.peakRainProb}
          </div>
          <div className="text-3xl font-bold font-mono tabular-nums text-sky-600 dark:text-sky-400">
            {peakRainProb}%
          </div>
        </div>
      </div>

      {/* District-Wise Weather Table */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {selectedState} · {dict.common.districtLabel}
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">Open-Meteo + IMD CAP</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3 font-medium">{dict.government.districtColumn}</th>
                <th className="px-4 py-3 font-medium">{dict.government.conditionColumn}</th>
                <th className="px-4 py-3 font-medium text-right">{dict.government.tempColumn}</th>
                <th className="px-4 py-3 font-medium text-right">{dict.government.rainProbColumn}</th>
                <th className="px-4 py-3 font-medium text-right">{dict.government.windColumn}</th>
                <th className="px-4 py-3 font-medium">{dict.government.warningsColumn}</th>
                <th className="px-6 py-3 font-medium text-right">{dict.government.actionColumn}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {districts.map((d) => (
                <tr key={d.location.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-6 py-3 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                      <span>{d.location.name}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                    {translateCondition(d.condition_label, language)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    {formatTemp(d.temperature_c, unit, 1)} / {formatTemp(d.feels_like_c, unit, 0)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-sky-600 dark:text-sky-400 whitespace-nowrap">
                    {d.rain_probability_percent ?? 0}% · {d.precipitation_mm.toFixed(1)}mm
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {d.wind_speed_kmh.toFixed(1)} km/h
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {d.active_alerts.length > 0 ? (
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        {d.active_alerts.length} ({d.active_alerts[0].severity})
                      </span>
                    ) : (
                      <span className="text-slate-400">{dict.government.noWarningsDistrict}</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onSelectLocation(d.location)}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-xs font-medium text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/30 whitespace-nowrap"
                    >
                      {dict.government.setLocationBtn}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Central 3-Day Flood ML Outlook + UP 14-District Monitoring Matrix */}
      <FloodRiskPanel
        prediction={floodPrediction}
        loading={floodLoading}
        language={language}
        userType="government"
        forecastDate={floodDate}
        onChangeForecastDate={onChangeFloodDate}
        onAskAssistant={onAskAssistant}
        showDateControl
      />

      {selectedState === 'Uttar Pradesh' && (
        <RegionalFloodTable
          forecastDate={floodDate}
          language={language}
          activeDistrictName={selectedLocation.name}
          onSelectLocation={onSelectLocation}
        />
      )}

      {/* District Chart + Official State Bulletins */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <section className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">
            {dict.government.districtChartTitle}
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 12, left: -14, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="temp" name={`${dict.forecast.tempSeries} (°${unit})`} fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="rainProb" name={dict.forecast.rainProbSeries} fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="lg:col-span-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {dict.government.officialBulletinsTitle}
              </h3>
            </div>
            <a
              href="https://sachet.ndma.gov.in"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400 hover:underline whitespace-nowrap"
            >
              <span>{dict.government.verifySource}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {data && data.state_alerts.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto">
              {data.state_alerts.map((a) => (
                <div key={a.id} className="py-3 space-y-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {a.title} · {a.affected_area}
                    </div>
                    <span className="text-xs font-semibold text-red-600 dark:text-red-400 whitespace-nowrap">
                      {a.severity}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {a.issuing_authority}
                    {a.valid_until ? ` · ${dict.alerts.validUntilLabel}: ${a.valid_until}` : ''}
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {a.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3 py-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {dict.government.noStateBulletins}
              </p>
              <button
                type="button"
                onClick={onOpenAlerts}
                className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-sky-600 dark:text-sky-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {dict.nav.alerts}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
