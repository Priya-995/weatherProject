import {
  AlertTriangle,
  CloudRain,
  Droplets,
  ExternalLink,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Sprout,
  Sun,
  Thermometer,
  Wind,
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
import { getDict, translateCondition } from '../../i18n/translations.ts';
import type {
  AlertsResponse,
  FloodPredictionResponse,
  HistoricalWeatherResponse,
  NormalizedWeatherResponse,
  UILanguageCode,
} from '../../types/weather.ts';
import {
  formatDayLabel,
  formatTemp,
  formatTimestamp,
  getWeatherIcon,
  type TempUnit,
} from '../../utils/weatherFormat.ts';
import { FloodRiskPanel } from '../FloodRiskPanel.tsx';

interface FarmerDashboardProps {
  weather: NormalizedWeatherResponse;
  historical: HistoricalWeatherResponse | null;
  alerts: AlertsResponse | null;
  floodPrediction: FloodPredictionResponse | null;
  floodLoading: boolean;
  floodDate: string;
  onChangeFloodDate: (dateStr: string) => void;
  loading: boolean;
  unit: TempUnit;
  language: UILanguageCode;
  onRefresh: () => void;
  onAskAssistant: (prompt: string) => void;
  onOpenAlerts: () => void;
}

export function FarmerDashboard({
  weather,
  historical,
  alerts,
  floodPrediction,
  floodLoading,
  floodDate,
  onChangeFloodDate,
  loading,
  unit,
  language,
  onRefresh,
  onAskAssistant,
}: FarmerDashboardProps) {
  const dict = getDict(language);
  const { location, current, daily, hourly } = weather;
  const HeroIcon = getWeatherIcon(current.weather_code, current.is_day);

  const rainSum7d = daily.reduce((s, d) => s + d.precipitation_sum_mm, 0);
  const rain48hSum = daily.slice(0, 2).reduce((s, d) => s + d.precipitation_sum_mm, 0);
  const maxRainProb48h = Math.max(...daily.slice(0, 2).map((d) => d.rain_probability_max_percent), 0);
  const maxTemp7d = Math.max(...daily.map((d) => d.temp_max_c), current.temperature_c);
  const maxWindToday = Math.max(
    ...hourly.slice(0, 24).map((h) => h.wind_speed_kmh),
    current.wind_speed_kmh
  );
  const hasStormSignal = hourly.slice(0, 24).some((h) => h.weather_code >= 95);

  const past7Days = historical ? historical.daily.slice(-7) : [];
  const past7dRainSum = past7Days.reduce((s, d) => s + d.precipitation_sum_mm, 0);
  const isDrySpell = historical ? past7dRainSum < 2 && rainSum7d < 5 : rainSum7d < 5;

  const rainLikelySoon = rain48hSum >= 3 || maxRainProb48h >= 50;
  const strongSprayWind = current.wind_speed_kmh >= 18 || maxWindToday >= 25;

  const rainChartData = daily.map((d, idx) => ({
    day: idx === 0 ? dict.common.today : formatDayLabel(d.date, language),
    rainMm: Number(d.precipitation_sum_mm.toFixed(1)),
    rainProb: d.rain_probability_max_percent,
  }));

  const localAlerts = alerts?.official_alerts || [];

  return (
    <div className="space-y-6">
      {/* Farm Location Summary Header */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Sprout className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{dict.roles.farmer.dashboardHeading}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {dict.common.updated} {formatTimestamp(weather.last_updated, language)}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {location.name}
              {location.admin1 ? `, ${location.admin1}` : ''}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {translateCondition(current.condition_label, language)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() =>
                onAskAssistant(dict.assistant.samplePromptsByRole.farmer[0])
              }
              className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-700 transition-colors whitespace-nowrap shrink-0"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{dict.common.askWeatherGpt}</span>
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

        {/* Farmer Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 pt-5">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <HeroIcon className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
              <span>{dict.forecast.tempSeries}</span>
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {formatTemp(current.temperature_c, unit, 1)}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Droplets className="h-3.5 w-3.5" />
              <span>{dict.common.humidity}</span>
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {current.humidity_percent}%
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <CloudRain className="h-3.5 w-3.5" />
              <span>{dict.farmer.rainSum7d}</span>
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-sky-600 dark:text-sky-400">
              {rainSum7d.toFixed(1)} mm
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Wind className="h-3.5 w-3.5" />
              <span>{dict.farmer.maxWindToday}</span>
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {maxWindToday.toFixed(1)} km/h
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Thermometer className="h-3.5 w-3.5" />
              <span>{dict.forecast.maxSeries}</span>
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
              {formatTemp(maxTemp7d, unit, 0)}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Sun className="h-3.5 w-3.5" />
              <span>{dict.farmer.past7dRain}</span>
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {historical ? `${past7dRainSum.toFixed(1)} mm` : '—'}
            </div>
          </div>
        </div>
      </section>

      {/* Active Heavy Rainfall / Official Warnings */}
      {localAlerts.length > 0 && (
        <section className="rounded-xl border border-red-200 dark:border-red-900/60 bg-white dark:bg-slate-900 p-5 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-red-700 dark:text-red-400">
              {localAlerts[0].title} ({localAlerts[0].severity}) · {localAlerts[0].issuing_authority}
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {localAlerts[0].description}
            </p>
          </div>
        </section>
      )}

      {/* Practical Field Considerations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-600 dark:text-sky-400">
            <Droplets className="h-4 w-4" />
            <span>{dict.farmer.irrigationTitle}</span>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {rainLikelySoon ? dict.farmer.irrigationWaitRain : dict.farmer.irrigationNormalCheck}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <Wind className="h-4 w-4" />
            <span>{dict.farmer.sprayingTitle}</span>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {strongSprayWind ? dict.farmer.sprayingCaution : dict.farmer.sprayingGood}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <Sprout className="h-4 w-4" />
            <span>{dict.farmer.sowingHarvestTitle}</span>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {rainSum7d >= 15 ? dict.farmer.sowingRainNote : dict.farmer.sowingDryNote}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <Sun className="h-4 w-4 text-amber-500" />
            <span>{dict.farmer.drySpellCheck}</span>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {isDrySpell ? dict.farmer.drySpellDetected : dict.farmer.noDrySpell}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-2 md:col-span-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
            <span>{dict.farmer.cropProtectionTitle}</span>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {hasStormSignal || maxWindToday >= 35
              ? dict.farmer.cropProtectStorm
              : maxTemp7d >= 39
              ? dict.farmer.cropProtectHeat
              : dict.farmer.cropProtectGeneral}
          </p>
        </div>
      </div>

      {/* Central 3-Day Flood ML Risk Outlook */}
      <FloodRiskPanel
        prediction={floodPrediction}
        loading={floodLoading}
        language={language}
        userType="farmer"
        forecastDate={floodDate}
        onChangeForecastDate={onChangeFloodDate}
        onAskAssistant={onAskAssistant}
        showDateControl
      />

      {/* 7-Day Rain Chart + Official Agromet Links */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <section className="lg:col-span-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {dict.farmer.rainOutlook7d} (mm)
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">Open-Meteo</span>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rainChartData} margin={{ top: 8, right: 12, left: -14, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
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
                <Bar
                  dataKey="rainMm"
                  name={dict.forecast.rainMmSeries}
                  fill="#0284c7"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {dict.farmer.agrometHeading}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {dict.farmer.agrometDisclaimer}
            </p>
          </div>

          <div className="space-y-2.5">
            <a
              href="https://imdagrimet.gov.in"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-xs font-medium text-sky-600 dark:text-sky-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <span>{dict.farmer.agrometLinkImd}</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </a>
            <a
              href="https://mausam.imd.gov.in"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-xs font-medium text-sky-600 dark:text-sky-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <span>{dict.farmer.agrometLinkMeghdoot}</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
