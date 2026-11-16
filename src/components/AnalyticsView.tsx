import { useEffect, useState } from 'react';
import { GitCompare, Layers } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getDict } from '../i18n/translations.ts';
import type {
  HistoricalWeatherResponse,
  LocationResult,
  NormalizedWeatherResponse,
  UILanguageCode,
} from '../types/weather.ts';
import {
  convertTemp,
  formatShortDate,
  formatTemp,
  formatTimestamp,
  type TempUnit,
} from '../utils/weatherFormat.ts';

interface AnalyticsViewProps {
  selectedLocation: LocationResult;
  unit: TempUnit;
  language: UILanguageCode;
}

interface AnalyticsPayload {
  primary: {
    location: LocationResult;
    historical: HistoricalWeatherResponse;
    forecast: NormalizedWeatherResponse;
  };
  comparison: {
    location: LocationResult;
    historical: HistoricalWeatherResponse;
    forecast: NormalizedWeatherResponse;
  } | null;
}

const COMPARE_CITIES = [
  'Delhi',
  'Mumbai',
  'Ahmedabad',
  'Lucknow',
  'Bengaluru',
  'Chennai',
  'Kolkata',
  'Jaipur',
  'Varanasi',
  'Pune',
];

export function AnalyticsView({ selectedLocation, unit, language }: AnalyticsViewProps) {
  const dict = getDict(language);
  const [compareCity, setCompareCity] = useState<string>(
    selectedLocation.name.toLowerCase() === 'delhi' ? 'Mumbai' : 'Delhi'
  );
  const [days, setDays] = useState<number>(14);
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [floodStatus, setFloodStatus] = useState<{
    module: string;
    status: string;
    region: string;
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          location: selectedLocation.name,
          compare: compareCity,
          days: String(days),
        });
        const [anRes, floodRes] = await Promise.all([
          fetch(`/api/analytics?${params.toString()}`),
          fetch('/api/flood/status'),
        ]);
        if (!anRes.ok) throw new Error('Unable to fetch historical and comparison analytics.');
        const anJson = (await anRes.json()) as AnalyticsPayload;
        if (!cancelled) setData(anJson);
        if (floodRes.ok) {
          const flJson = await floodRes.json();
          if (!cancelled) setFloodStatus(flJson);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Analytics fetch failed.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedLocation.name, compareCity, days]);

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-72 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" />
        <div className="h-72 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-900/60 bg-white dark:bg-slate-900 p-6 text-sm text-red-700 dark:text-red-300">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const { primary, comparison } = data;

  const histRows = primary.historical.daily.map((d) => ({
    date: d.date,
    label: formatShortDate(d.date, language),
    histMax: Number(convertTemp(d.temp_max_c, unit).toFixed(1)),
    histMin: Number(convertTemp(d.temp_min_c, unit).toFixed(1)),
    histRain: d.precipitation_sum_mm,
    fcMax: null as number | null,
    fcMin: null as number | null,
  }));

  const fcRows = primary.forecast.daily.map((d) => ({
    date: d.date,
    label: formatShortDate(d.date, language),
    histMax: null as number | null,
    histMin: null as number | null,
    histRain: null as number | null,
    fcMax: Number(convertTemp(d.temp_max_c, unit).toFixed(1)),
    fcMin: Number(convertTemp(d.temp_min_c, unit).toFixed(1)),
  }));

  const boundaryLabel = fcRows[0]?.label;
  const combinedTimeline = [...histRows, ...fcRows];

  const locationCompareSeries = primary.forecast.daily.map((d, idx) => {
    const compDay = comparison?.forecast.daily[idx];
    return {
      day: formatShortDate(d.date, language),
      primaryMax: Number(convertTemp(d.temp_max_c, unit).toFixed(1)),
      compareMax: compDay ? Number(convertTemp(compDay.temp_max_c, unit).toFixed(1)) : null,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {dict.analytics.heading} — {primary.location.name}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2">
            <span>{primary.historical.source}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {dict.analytics.archiveLabel} {primary.historical.start_date} –{' '}
              {primary.historical.end_date}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {dict.common.updated} {formatTimestamp(primary.historical.last_updated, language)}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800">
            {[14, 30].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  days === d
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {dict.analytics.pastDaysBtn.replace('{days}', String(d))}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <GitCompare className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>{dict.analytics.compareWith}</span>
            <select
              value={compareCity}
              onChange={(e) => setCompareCity(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
            >
              {COMPARE_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Historical vs Future Forecast */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {dict.analytics.histVsFcTitle} (°{unit})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {dict.analytics.histVsFcSub}
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={combinedTimeline} margin={{ top: 12, right: 16, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
              />
              {boundaryLabel && (
                <ReferenceLine
                  x={boundaryLabel}
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  label={{ value: dict.analytics.forecastStart, position: 'top', fill: '#64748b', fontSize: 11 }}
                />
              )}
              <Line type="monotone" dataKey="histMax" name={`${dict.analytics.histMax} (°${unit})`} stroke="#0284c7" strokeWidth={2} dot={false} connectNulls={false} />
              <Line type="monotone" dataKey="histMin" name={`${dict.analytics.histMin} (°${unit})`} stroke="#64748b" strokeWidth={1.75} dot={false} connectNulls={false} />
              <Line type="monotone" dataKey="fcMax" name={`${dict.analytics.fcMax} (°${unit})`} stroke="#f59e0b" strokeWidth={2.25} strokeDasharray="5 4" dot={{ r: 2.5 }} connectNulls={false} />
              <Line type="monotone" dataKey="fcMin" name={`${dict.analytics.fcMin} (°${unit})`} stroke="#10b981" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 2.5 }} connectNulls={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {dict.analytics.histRainTitle.replace('{days}', String(days))}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-4">
            {dict.analytics.histRainSub} {primary.location.name}
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histRows} margin={{ top: 8, right: 12, left: -14, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                />
                <Bar dataKey="histRain" name={dict.analytics.observedRainSeries} fill="#0284c7" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {dict.analytics.compareTitle}: {primary.location.name} vs {comparison?.location.name || compareCity}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {dict.analytics.compareSub} (°{unit})
              </p>
            </div>
            {comparison && (
              <div className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300">
                {dict.analytics.nowLabel}: {formatTemp(primary.forecast.current.temperature_c, unit, 1)} vs{' '}
                {formatTemp(comparison.forecast.current.temperature_c, unit, 1)}
              </div>
            )}
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={locationCompareSeries} margin={{ top: 8, right: 12, left: -14, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                />
                <Bar dataKey="primaryMax" name={`${primary.location.name} (°${unit})`} fill="#0284c7" radius={[3, 3, 0, 0]} />
                <Bar dataKey="compareMax" name={`${comparison?.location.name || compareCity} (°${unit})`} fill="#f59e0b" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Modular Future Flood Prediction Slot */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Layers className="h-5 w-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {dict.analytics.floodModuleTitle} ({floodStatus?.region || 'Uttar Pradesh'})
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {floodStatus?.message ||
                'Modular flood-prediction service slot is prepared in the FastAPI backend.'}
            </p>
          </div>
        </div>
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
          {dict.analytics.floodStatusPrefix}: {floodStatus?.status || 'awaiting_model'}
        </span>
      </section>
    </div>
  );
}
