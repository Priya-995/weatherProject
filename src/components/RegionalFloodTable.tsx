import { useEffect, useState } from 'react';
import { AlertTriangle, ExternalLink, MapPin, Waves } from 'lucide-react';
import { getDistrictsForState } from '../data/indiaRegions.ts';
import { getFloodDict } from '../i18n/floodTranslations.ts';
import { getDict } from '../i18n/translations.ts';
import type {
  FloodPredictionResponse,
  FloodRegionalResponse,
  FloodRiskLevel,
  LocationResult,
  UILanguageCode,
} from '../types/weather.ts';

interface RegionalFloodTableProps {
  forecastDate: string;
  language: UILanguageCode;
  activeDistrictName?: string;
  onSelectLocation: (loc: LocationResult) => void;
}

function riskTextClass(level: FloodRiskLevel): string {
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

function toLocationResult(item: FloodPredictionResponse): LocationResult | null {
  const upDistricts = getDistrictsForState('Uttar Pradesh');
  const display = (item.display_district || item.district_input || '').trim();
  const matched = upDistricts.find(
    (d) =>
      d.name.toLowerCase() === display.toLowerCase() ||
      d.name.toLowerCase() === (item.canonical_district || '').toLowerCase()
  );
  if (matched) return matched;
  if (item.coordinates) {
    return {
      name: display,
      admin1: 'Uttar Pradesh',
      country: 'India',
      country_code: 'IN',
      latitude: item.coordinates.district_lat,
      longitude: item.coordinates.district_lon,
      timezone: 'Asia/Kolkata',
    };
  }
  return null;
}

export function RegionalFloodTable({
  forecastDate,
  language,
  activeDistrictName,
  onSelectLocation,
}: RegionalFloodTableProps) {
  const dict = getDict(language);
  const fDict = getFloodDict(language);
  const [regional, setRegional] = useState<FloodRegionalResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadRegional = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/flood/regional?forecast_date=${encodeURIComponent(forecastDate)}`
        );
        if (res.ok && !cancelled) {
          setRegional((await res.json()) as FloodRegionalResponse);
        }
      } catch {
        // Non-blocking; if offline, panel renders empty/fallback
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadRegional();
    return () => {
      cancelled = true;
    };
  }, [forecastDate]);

  const districts = regional?.districts ?? [];
  const firstUnavailableReason =
    districts.length > 0 && districts.every((d) => d.status === 'unavailable')
      ? districts[0].reason || ''
      : '';

  return (
    <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Waves className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {fDict.regionalTableTitle}
            </h3>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300">
              {fDict.nonOfficialBadge}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {fDict.regionalTableSub} ·{' '}
            <span className="font-mono tabular-nums">{forecastDate}</span>
          </p>
        </div>

        <a
          href="https://ffs.india-water.gov.in"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline whitespace-nowrap"
        >
          <span>{fDict.verifyCwcLink}</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {loading && !regional ? (
        <div className="px-6 py-5 text-xs text-slate-500 dark:text-slate-400">
          {fDict.regionalLoadingText}
        </div>
      ) : firstUnavailableReason ? (
        <div className="p-6">
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {fDict.statusUnavailableTitle}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {fDict.reasons[firstUnavailableReason] || districts[0]?.message}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3 font-medium">{dict.government.districtColumn}</th>
                <th className="px-4 py-3 font-medium">{fDict.studyGroupCol}</th>
                <th className="px-4 py-3 font-medium text-right">{fDict.probShortCol}</th>
                <th className="px-4 py-3 font-medium text-right">{fDict.thresholdLabel}</th>
                <th className="px-4 py-3 font-medium">{fDict.riskSignalCol}</th>
                <th className="px-4 py-3 font-medium text-right">{fDict.dischargeCol}</th>
                <th className="px-6 py-3 font-medium text-right">{dict.government.actionColumn}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {districts.map((item) => {
                const display = item.display_district || item.district_input;
                const isSelected =
                  activeDistrictName &&
                  display.toLowerCase() === activeDistrictName.toLowerCase();
                const loc = toLocationResult(item);

                return (
                  <tr
                    key={item.canonical_district || display}
                    className={
                      isSelected
                        ? 'bg-sky-50/60 dark:bg-sky-950/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }
                  >
                    <td className="px-6 py-3 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                        <span>{display}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 capitalize">
                      {item.study_group ? `UP ${item.study_group}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {item.status === 'available' && item.probability !== null
                        ? `${(item.probability * 100).toFixed(1)}%`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {item.threshold !== null ? `${(item.threshold * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      <span
                        className={`inline-block font-semibold px-2 py-0.5 rounded border ${riskTextClass(
                          item.risk_level
                        )}`}
                      >
                        {fDict.riskLabels[item.risk_level]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {item.features ? item.features.discharge.toFixed(1) : '—'}
                    </td>
                    <td className="px-6 py-3 text-right">
                      {loc && (
                        <button
                          type="button"
                          onClick={() => onSelectLocation(loc)}
                          className="rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-xs font-medium text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/30 whitespace-nowrap"
                        >
                          {fDict.focusDistrictBtn}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
        {fDict.disclaimer}
      </div>
    </section>
  );
}
