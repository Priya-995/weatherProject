import {
  AlertTriangle,
  Car,
  CheckCircle2,
  Compass,
  Droplets,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Sun,
  Sunrise,
  Sunset,
  Thermometer,
  Umbrella,
  Wind,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getDict, translateCondition, translateWindDir } from '../../i18n/translations.ts';
import type {
  AlertsResponse,
  LocationResult,
  NormalizedWeatherResponse,
  UILanguageCode,
} from '../../types/weather.ts';
import {
  convertTemp,
  formatDayLabel,
  formatShortTime,
  formatTemp,
  formatTimestamp,
  getWeatherIcon,
  type TempUnit,
} from '../../utils/weatherFormat.ts';

interface CitizenDashboardProps {
  weather: NormalizedWeatherResponse;
  alerts: AlertsResponse | null;
  loading: boolean;
  unit: TempUnit;
  language: UILanguageCode;
  quickCities: LocationResult[];
  onRefresh: () => void;
  onQuickCity: (loc: LocationResult) => void;
  onAskAssistant: (prompt: string) => void;
  onOpenAlerts: () => void;
}

export function CitizenDashboard({
  weather,
  alerts,
  loading,
  unit,
  language,
  quickCities,
  onRefresh,
  onQuickCity,
  onAskAssistant,
  onOpenAlerts,
}: CitizenDashboardProps) {
  const dict = getDict(language);
  const { location, current, hourly, daily } = weather;
  const HeroIcon = getWeatherIcon(current.weather_code, current.is_day);

  const next24h = hourly.slice(0, 24).map((h) => ({
    label: formatShortTime(h.time),
    temp: Number(convertTemp(h.temperature_c, unit).toFixed(1)),
    rainProb: h.rain_probability_percent,
  }));

  const maxRainProb24h = Math.max(...hourly.slice(0, 24).map((h) => h.rain_probability_percent), 0);
  const maxTemp24h = Math.max(...hourly.slice(0, 24).map((h) => h.temperature_c), current.temperature_c);
  const maxWind24h = Math.max(...hourly.slice(0, 24).map((h) => h.wind_speed_kmh), current.wind_speed_kmh);
  const expectRain = maxRainProb24h >= 45 || (daily[0]?.precipitation_sum_mm ?? 0) >= 2;
  const highHeat = maxTemp24h >= 38;
  const roughCommute = expectRain || maxWind24h >= 35;

  const weekMin = Math.min(...daily.map((d) => d.temp_min_c));
  const weekMax = Math.max(...daily.map((d) => d.temp_max_c));
  const weekSpan = Math.max(weekMax - weekMin, 1);

  const localAlerts = alerts?.official_alerts || [];

  return (
    <div className="space-y-6">
      {/* Quick Stations & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1.5">
            {dict.common.stations}:
          </span>
          {quickCities.map((city) => {
            const active = city.name.toLowerCase() === location.name.toLowerCase();
            return (
              <button
                key={city.name}
                type="button"
                onClick={() => onQuickCity(city)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-sky-600 text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {city.name}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onAskAssistant(`${dict.citizen.sampleQ1} (${location.name})`)}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-700 transition-colors whitespace-nowrap shrink-0"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>
              {dict.common.askWeatherGpt} · {location.name}
            </span>
          </button>
          <button
            type="button"
            onClick={onRefresh}
            aria-label={dict.common.refresh}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{dict.common.refresh}</span>
          </button>
        </div>
      </div>

      {/* Hero Local Weather Card */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>{dict.roles.citizen.dashboardHeading}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {dict.common.updated} {formatTimestamp(weather.last_updated, language)}
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                {location.name}
              </h2>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {[location.admin1, location.country].filter(Boolean).join(', ')}
              </span>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300">
              {translateCondition(current.condition_label, language)}
              {daily[0] && (
                <span className="ml-2 font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  H: {formatTemp(daily[0].temp_max_c, unit, 0)} · L:{' '}
                  {formatTemp(daily[0].temp_min_c, unit, 0)}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400">
              <HeroIcon className="h-9 w-9" />
            </div>
            <div>
              <div className="text-5xl font-bold font-mono tabular-nums tracking-tight text-slate-900 dark:text-white">
                {formatTemp(current.temperature_c, unit, 1)}
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                {dict.common.observed} {formatShortTime(current.observed_at)} · {dict.common.localTime}
              </div>
            </div>
          </div>
        </div>

        {/* Core Everyday Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 pt-6">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Thermometer className="h-3.5 w-3.5" />
              <span>{dict.common.feelsLike}</span>
            </div>
            <div className="text-xl font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {formatTemp(current.feels_like_c, unit, 1)}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Droplets className="h-3.5 w-3.5" />
              <span>{dict.common.humidity}</span>
            </div>
            <div className="text-xl font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {current.humidity_percent}%
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Wind className="h-3.5 w-3.5" />
              <span>{dict.common.windSpeed}</span>
            </div>
            <div className="text-xl font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {current.wind_speed_kmh.toFixed(1)} km/h
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              <Compass className="h-3 w-3" />
              <span>
                {translateWindDir(current.wind_direction_cardinal, language)} (
                {Math.round(current.wind_direction_deg)}°)
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Umbrella className="h-3.5 w-3.5" />
              <span>{dict.common.rainProbability}</span>
            </div>
            <div className="text-xl font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {current.rain_probability_percent != null
                ? `${current.rain_probability_percent}%`
                : '—'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              {current.precipitation_mm.toFixed(1)} mm {dict.common.current}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Sunrise className="h-3.5 w-3.5" />
              <span>{dict.common.sunrise}</span>
            </div>
            <div className="text-xl font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {formatShortTime(current.sunrise)}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Sunset className="h-3.5 w-3.5" />
              <span>{dict.common.sunset}</span>
            </div>
            <div className="text-xl font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100">
              {formatShortTime(current.sunset)}
            </div>
          </div>
        </div>
      </section>

      {/* Everyday Citizen Guidance Grid (Travel, Outdoor, Precautions) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-600 dark:text-sky-400">
            <Car className="h-4 w-4" />
            <span>{dict.citizen.travelAdviceLabel}</span>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {roughCommute ? dict.citizen.commuteCaution : dict.citizen.commuteSafe}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <Sun className="h-4 w-4" />
            <span>{dict.citizen.outdoorAdviceLabel}</span>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {expectRain
              ? dict.citizen.outdoorAvoidRain
              : highHeat
              ? dict.citizen.outdoorAvoidHeat
              : dict.citizen.outdoorGood}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
            <span>{dict.citizen.precautionsLabel}</span>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {expectRain ? dict.citizen.umbrellaCarry : dict.citizen.umbrellaNotNeeded}
          </p>
        </div>
      </section>

      {/* Local Warnings Strip */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          {localAlerts.length > 0 ? (
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {dict.citizen.localAlertHeading} — {location.name}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {localAlerts.length > 0
                ? `${localAlerts[0].title} (${localAlerts[0].severity}) — ${localAlerts[0].description.slice(0, 140)}`
                : dict.citizen.noLocalAlertText}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenAlerts}
          className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
        >
          {dict.nav.alerts}
        </button>
      </section>

      {/* 24h Hourly + 7-Day Forecast Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <section className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {dict.citizen.hourlyHeading}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {dict.citizen.hourlySub}
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                {dict.common.next24h}
              </span>
            </div>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={next24h} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="citTempGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} interval={2} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="temp"
                    name={`${dict.forecast.tempSeries} (°${unit})`}
                    stroke="#0284c7"
                    strokeWidth={2}
                    fill="url(#citTempGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 overflow-x-auto">
            <div className="flex items-stretch gap-4 min-w-max pb-1">
              {hourly.slice(0, 12).map((h) => {
                const Icon = getWeatherIcon(h.weather_code, true);
                return (
                  <div
                    key={h.time}
                    className="flex flex-col items-center gap-1.5 min-w-[60px] text-center"
                  >
                    <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {formatShortTime(h.time)}
                    </span>
                    <Icon className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                    <span className="text-sm font-semibold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                      {formatTemp(h.temperature_c, unit, 0)}
                    </span>
                    <span className="text-[11px] font-mono tabular-nums text-sky-600 dark:text-sky-400">
                      {h.rain_probability_percent}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {dict.citizen.dailyHeading}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {dict.citizen.dailySub}
              </p>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">Open-Meteo</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {daily.map((d, idx) => {
              const Icon = getWeatherIcon(d.weather_code, true);
              const leftPct = ((d.temp_min_c - weekMin) / weekSpan) * 100;
              const widthPct = Math.max(((d.temp_max_c - d.temp_min_c) / weekSpan) * 100, 8);
              return (
                <div
                  key={d.date}
                  className="py-3 flex items-center justify-between gap-3 text-sm"
                >
                  <div className="w-28 shrink-0">
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      {idx === 0 ? dict.common.today : formatDayLabel(d.date, language)}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {translateCondition(d.condition_label, language)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 w-16">
                    <Icon className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                    <span className="text-xs font-mono tabular-nums text-sky-600 dark:text-sky-400">
                      {d.rain_probability_max_percent}%
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 flex-1 min-w-[110px]">
                    <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 w-9 text-right">
                      {formatTemp(d.temp_min_c, unit, 0)}
                    </span>
                    <div className="relative h-1.5 flex-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-sky-500 to-amber-500"
                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100 w-9">
                      {formatTemp(d.temp_max_c, unit, 0)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
