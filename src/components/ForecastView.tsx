import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getDict, translateCondition } from '../i18n/translations.ts';
import type { LocationResult, NormalizedWeatherResponse, UILanguageCode } from '../types/weather.ts';
import {
  convertTemp,
  formatDayLabel,
  formatShortTime,
  formatTemp,
  formatTimestamp,
  getWeatherIcon,
  type TempUnit,
} from '../utils/weatherFormat.ts';

interface ForecastViewProps {
  selectedLocation: LocationResult;
  unit: TempUnit;
  language: UILanguageCode;
}

export function ForecastView({ selectedLocation, unit, language }: ForecastViewProps) {
  const dict = getDict(language);
  const [model, setModel] = useState<'best_match' | 'gfs_seamless'>('best_match');
  const [data, setData] = useState<NormalizedWeatherResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          lat: String(selectedLocation.latitude),
          lon: String(selectedLocation.longitude),
          name: selectedLocation.name,
          country: selectedLocation.country,
          model,
        });
        if (selectedLocation.admin1) params.set('admin1', selectedLocation.admin1);
        const res = await fetch(`/api/forecast?${params.toString()}`);
        if (!res.ok) throw new Error('Unable to fetch forecast from Open-Meteo.');
        const json = (await res.json()) as NormalizedWeatherResponse;
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Forecast fetch error.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedLocation, model]);

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

  const hourlyData = data.hourly.slice(0, 48).map((h) => ({
    label: `${h.time.slice(5, 10)} ${formatShortTime(h.time)}`,
    temp: Number(convertTemp(h.temperature_c, unit).toFixed(1)),
    feels: Number(convertTemp(h.feels_like_c, unit).toFixed(1)),
    rainProb: h.rain_probability_percent,
    rainMm: h.precipitation_mm,
    wind: h.wind_speed_kmh,
  }));

  const dailyData = data.daily.map((d) => ({
    day: formatDayLabel(d.date, language),
    max: Number(convertTemp(d.temp_max_c, unit).toFixed(1)),
    min: Number(convertTemp(d.temp_min_c, unit).toFixed(1)),
    rainProb: d.rain_probability_max_percent,
    rainSum: d.precipitation_sum_mm,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {dict.forecast.heading} — {data.location.name}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2">
            <span>{data.current.source}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {dict.common.updated} {formatTimestamp(data.last_updated, language)}
            </span>
          </p>
        </div>

        <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setModel('best_match')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              model === 'best_match'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {dict.forecast.bestMatch}
          </button>
          <button
            type="button"
            onClick={() => setModel('gfs_seamless')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              model === 'gfs_seamless'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {dict.forecast.gfsSeamless}
          </button>
        </div>
      </div>

      {/* Hourly Temperature Chart */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {dict.forecast.hourlyTempTitle} (°{unit})
        </h3>
        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyData} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="fcTempGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} interval={5} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="temp" name={`${dict.forecast.tempSeries} (°${unit})`} stroke="#0284c7" strokeWidth={2} fill="url(#fcTempGrad)" />
              <Line type="monotone" dataKey="feels" name={`${dict.forecast.feelsSeries} (°${unit})`} stroke="#f59e0b" strokeWidth={1.75} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Hourly Rain Probability + Daily High/Low Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {dict.forecast.rainProbTitle}
          </h3>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={hourlyData} margin={{ top: 8, right: 12, left: -14, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} interval={7} tickLine={false} axisLine={false} />
                <YAxis yAxisId="prob" domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="mm" orientation="right" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                />
                <Bar yAxisId="mm" dataKey="rainMm" name={dict.forecast.rainMmSeries} fill="#0ea5e9" radius={[3, 3, 0, 0]} />
                <Line yAxisId="prob" type="monotone" dataKey="rainProb" name={dict.forecast.rainProbSeries} stroke="#16a34a" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {dict.forecast.dailyRangeTitle} (°{unit})
          </h3>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dailyData} margin={{ top: 8, right: 12, left: -14, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                />
                <Bar dataKey="max" name={`${dict.forecast.maxSeries} (°${unit})`} fill="#f59e0b" radius={[3, 3, 0, 0]} />
                <Bar dataKey="min" name={`${dict.forecast.minSeries} (°${unit})`} fill="#0284c7" radius={[3, 3, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* 7-Day Detailed Tabular Grid */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {dict.forecast.tableTitle}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3 font-medium">{dict.forecast.colDate}</th>
                <th className="px-4 py-3 font-medium">{dict.forecast.colCondition}</th>
                <th className="px-4 py-3 font-medium text-right">{dict.forecast.colMinMax}</th>
                <th className="px-4 py-3 font-medium text-right">{dict.forecast.colRainProb}</th>
                <th className="px-4 py-3 font-medium text-right">{dict.forecast.colRainSum}</th>
                <th className="px-4 py-3 font-medium text-right">{dict.forecast.colMaxWind}</th>
                <th className="px-4 py-3 font-medium text-right">{dict.forecast.colUvMax}</th>
                <th className="px-6 py-3 font-medium text-right">{dict.forecast.colSun}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.daily.map((d) => {
                const Icon = getWeatherIcon(d.weather_code, true);
                return (
                  <tr key={d.date} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-6 py-3 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {formatDayLabel(d.date, language)}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                      <span className="inline-flex items-center gap-2">
                        <Icon className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
                        <span>{translateCondition(d.condition_label, language)}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {formatTemp(d.temp_min_c, unit, 0)} / {formatTemp(d.temp_max_c, unit, 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-sky-600 dark:text-sky-400">
                      {d.rain_probability_max_percent}%
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {d.precipitation_sum_mm.toFixed(1)} mm
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {d.wind_speed_max_kmh.toFixed(1)} km/h
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {d.uv_index_max != null ? d.uv_index_max.toFixed(1) : '—'}
                    </td>
                    <td className="px-6 py-3 text-right font-mono tabular-nums text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatShortTime(d.sunrise)} / {formatShortTime(d.sunset)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
