import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  ExternalLink,
  Info,
  MessageSquare,
  ShieldAlert,
  Waves,
} from 'lucide-react';
import { getFloodDict } from '../i18n/floodTranslations.ts';
import type {
  FloodPredictionResponse,
  FloodRiskLevel,
  UILanguageCode,
  UserRoleType,
} from '../types/weather.ts';

interface FloodRiskPanelProps {
  prediction: FloodPredictionResponse | null;
  loading?: boolean;
  language: UILanguageCode;
  userType: UserRoleType;
  forecastDate: string;
  onChangeForecastDate?: (dateStr: string) => void;
  onAskAssistant?: (prompt: string) => void;
  showDateControl?: boolean;
}

function riskBadgeStyle(level: FloodRiskLevel): string {
  switch (level) {
    case 'elevated':
      return 'border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300';
    case 'moderate':
      return 'border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300';
    case 'low':
      return 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300';
    default:
      return 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300';
  }
}

export function FloodRiskPanel({
  prediction,
  loading = false,
  language,
  userType,
  forecastDate,
  onChangeForecastDate,
  onAskAssistant,
  showDateControl = false,
}: FloodRiskPanelProps) {
  const fDict = getFloodDict(language);
  const [draftDate, setDraftDate] = useState(forecastDate);

  useEffect(() => {
    setDraftDate(forecastDate);
  }, [forecastDate]);

  const isAvailable = prediction?.status === 'available' && prediction.probability !== null;
  const roleNote =
    isAvailable && prediction.risk_level !== 'unavailable'
      ? fDict.roleGuidance[userType][prediction.risk_level]
      : null;

  const reasonKey = prediction?.reason || '';
  const localizedReason = fDict.reasons[reasonKey] || prediction?.message || '';

  return (
    <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Waves className="h-5 w-5 text-sky-600 dark:text-sky-400 shrink-0" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {fDict.sectionTitle}
              {prediction?.display_district ? ` — ${prediction.display_district}` : ''}
            </h3>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300">
              {fDict.nonOfficialBadge}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {fDict.modelMetaLabel} · {fDict.horizonLabel} ·{' '}
            <span className="font-mono tabular-nums">{prediction?.forecast_date || forecastDate}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {showDateControl && onChangeForecastDate && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (draftDate) onChangeForecastDate(draftDate);
              }}
              className="flex items-center gap-1.5"
            >
              <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <input
                  type="date"
                  value={draftDate}
                  onChange={(e) => setDraftDate(e.target.value)}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2 py-1 text-xs font-mono text-slate-900 dark:text-slate-100"
                />
              </label>
              <button
                type="submit"
                className="rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
              >
                {fDict.applyDateBtn}
              </button>
            </form>
          )}

          {onAskAssistant && (
            <button
              type="button"
              onClick={() =>
                onAskAssistant(
                  `Check flood onset prediction and rainfall risk for ${prediction?.display_district || prediction?.district_input || 'Gonda'} on ${prediction?.forecast_date || forecastDate}.`
                )
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50/70 dark:bg-sky-950/30 px-3 py-1.5 text-xs font-medium text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-950/50 transition-colors whitespace-nowrap"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{fDict.askFloodBtn}</span>
            </button>
          )}
        </div>
      </div>

      {loading && !prediction ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">{fDict.loadingText}</p>
      ) : isAvailable && prediction ? (
        <div className="space-y-4">
          {/* Shared Calibrated Prediction Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-1">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {fDict.probabilityLabel}
              </div>
              <div className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {(prediction.probability! * 100).toFixed(1)}%
              </div>
              <span
                className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded border ${riskBadgeStyle(
                  prediction.risk_level
                )}`}
              >
                {fDict.riskLabels[prediction.risk_level]}
              </span>
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-1">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {fDict.thresholdLabel}
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {prediction.threshold !== null ? `${(prediction.threshold * 100).toFixed(1)}%` : '—'}
              </div>
              <div
                className={`text-xs font-medium ${
                  prediction.threshold_exceeded
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {prediction.threshold_exceeded
                  ? fDict.thresholdExceededYes
                  : fDict.thresholdExceededNo}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-1">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {fDict.baselineLabel}
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {prediction.climatology_probability != null
                  ? `${(prediction.climatology_probability * 100).toFixed(2)}%`
                  : '—'}
              </div>
              {prediction.study_group && (
                <div className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                  UP {prediction.study_group}
                </div>
              )}
            </div>

            {(userType === 'government' || userType === 'disaster') && (
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-1">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {fDict.rawProbLabel}
                </div>
                <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {prediction.raw_probability != null
                    ? `${(prediction.raw_probability * 100).toFixed(1)}%`
                    : '—'}
                </div>
                {prediction.coordinates && (
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    River: {prediction.coordinates.river_lat}, {prediction.coordinates.river_lon}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Role-Tailored Actionable Explanation */}
          {roleNote && (
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4 flex items-start gap-3">
              {prediction.risk_level === 'elevated' ? (
                <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              ) : (
                <Info className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
              )}
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {roleNote}
              </p>
            </div>
          )}

          {/* Detailed Hydrological & Meteorological Inputs for Disaster Manager & Government Agency */}
          {(userType === 'disaster' || userType === 'government') && prediction.features && (
            <div className="space-y-2.5 pt-1">
              <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {fDict.featuresHeading}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {(Object.keys(fDict.featureLabels) as Array<keyof typeof fDict.featureLabels>).map(
                  (key) => (
                    <div
                      key={key}
                      className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2"
                    >
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {fDict.featureLabels[key]}
                      </div>
                      <div className="text-sm font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
                        {prediction.features![key].toFixed(
                          key === 'soil_moisture' || key === 'soil_change_7d' ? 3 : 2
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4 space-y-2.5">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {fDict.statusUnavailableTitle}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {localizedReason}
              </p>
              {prediction?.message && localizedReason !== prediction.message && (
                <p className="text-[11px] font-mono text-slate-500 dark:text-slate-500">
                  {prediction.message}
                </p>
              )}
            </div>
          </div>

          {prediction?.supported_districts && prediction.supported_districts.length > 0 && (
            <div className="pt-1 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {fDict.supportedDistrictsLabel}:{' '}
              </span>
              <span className="capitalize">{prediction.supported_districts.join(', ')}</span>
            </div>
          )}
        </div>
      )}

      {/* Mandatory Official Separation Disclaimer */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <span>{fDict.disclaimer}</span>
        <a
          href="https://ffs.india-water.gov.in"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-medium text-sky-600 dark:text-sky-400 hover:underline shrink-0"
        >
          <span>{fDict.verifyCwcLink}</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </section>
  );
}
