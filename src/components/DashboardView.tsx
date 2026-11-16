import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { getDict } from '../i18n/translations.ts';
import type {
  AlertsResponse,
  HistoricalWeatherResponse,
  LocationResult,
  MapStationPoint,
  NormalizedWeatherResponse,
  UILanguageCode,
  UserRoleType,
} from '../types/weather.ts';
import type { TempUnit } from '../utils/weatherFormat.ts';
import { CitizenDashboard } from './dashboards/CitizenDashboard.tsx';
import { DisasterManagerDashboard } from './dashboards/DisasterManagerDashboard.tsx';
import { FarmerDashboard } from './dashboards/FarmerDashboard.tsx';
import { GovernmentDashboard } from './dashboards/GovernmentDashboard.tsx';

interface DashboardViewProps {
  weather: NormalizedWeatherResponse | null;
  selectedLocation: LocationResult;
  loading: boolean;
  error: string | null;
  unit: TempUnit;
  language: UILanguageCode;
  userType: UserRoleType;
  onRefresh: () => void;
  onQuickCity: (loc: LocationResult) => void;
  onAskAssistant: (prompt: string) => void;
  onOpenAlerts: () => void;
}

const QUICK_CITIES: LocationResult[] = [
  { name: 'Ahmedabad', admin1: 'Gujarat', country: 'India', country_code: 'IN', latitude: 23.0225, longitude: 72.5714, timezone: 'Asia/Kolkata' },
  { name: 'Delhi', admin1: 'Delhi', country: 'India', country_code: 'IN', latitude: 28.6139, longitude: 77.209, timezone: 'Asia/Kolkata' },
  { name: 'Mumbai', admin1: 'Maharashtra', country: 'India', country_code: 'IN', latitude: 19.076, longitude: 72.8777, timezone: 'Asia/Kolkata' },
  { name: 'Lucknow', admin1: 'Uttar Pradesh', country: 'India', country_code: 'IN', latitude: 26.8467, longitude: 80.9462, timezone: 'Asia/Kolkata' },
  { name: 'Bengaluru', admin1: 'Karnataka', country: 'India', country_code: 'IN', latitude: 12.9716, longitude: 77.5946, timezone: 'Asia/Kolkata' },
  { name: 'Chennai', admin1: 'Tamil Nadu', country: 'India', country_code: 'IN', latitude: 13.0827, longitude: 80.2707, timezone: 'Asia/Kolkata' },
];

export function DashboardView({
  weather,
  selectedLocation,
  loading,
  error,
  unit,
  language,
  userType,
  onRefresh,
  onQuickCity,
  onAskAssistant,
  onOpenAlerts,
}: DashboardViewProps) {
  const dict = getDict(language);
  const [alertsData, setAlertsData] = useState<AlertsResponse | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalWeatherResponse | null>(null);
  const [stationsData, setStationsData] = useState<MapStationPoint[]>([]);

  useEffect(() => {
    let cancelled = false;
    const loadRoleExtras = async () => {
      try {
        const params = new URLSearchParams({
          lat: String(selectedLocation.latitude),
          lon: String(selectedLocation.longitude),
          name: selectedLocation.name,
          country: selectedLocation.country,
        });
        if (selectedLocation.admin1) params.set('admin1', selectedLocation.admin1);
        if (selectedLocation.country_code) params.set('country_code', selectedLocation.country_code);

        const alertsRes = await fetch(`/api/alerts?${params.toString()}`);
        if (alertsRes.ok && !cancelled) {
          setAlertsData((await alertsRes.json()) as AlertsResponse);
        }

        if (userType === 'farmer') {
          const histRes = await fetch(
            `/api/historical?location=${encodeURIComponent(selectedLocation.name)}&days=7`
          );
          if (histRes.ok && !cancelled) {
            setHistoricalData((await histRes.json()) as HistoricalWeatherResponse);
          }
        }

        if (userType === 'disaster') {
          const stRes = await fetch(`/api/map/stations?${params.toString()}`);
          if (stRes.ok && !cancelled) {
            const stJson = (await stRes.json()) as { stations: MapStationPoint[] };
            setStationsData(stJson.stations || []);
          }
        }
      } catch {
        // Non-blocking supplementary role fetch
      }
    };
    loadRoleExtras();
    return () => {
      cancelled = true;
    };
  }, [
    selectedLocation.latitude,
    selectedLocation.longitude,
    selectedLocation.name,
    selectedLocation.admin1,
    userType,
  ]);

  if (userType === 'government') {
    return (
      <GovernmentDashboard
        selectedLocation={selectedLocation}
        unit={unit}
        language={language}
        onSelectLocation={onQuickCity}
        onOpenAlerts={onOpenAlerts}
      />
    );
  }

  if (loading && !weather) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-56 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" />
          <div className="h-80 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" />
        </div>
      </div>
    );
  }

  if (error && !weather) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-900/60 bg-white dark:bg-slate-900 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {dict.common.weatherUnavailable}
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{error}</p>
        <button
          type="button"
          onClick={onRefresh}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>{dict.common.retry}</span>
        </button>
      </div>
    );
  }

  if (!weather) return null;

  if (userType === 'farmer') {
    return (
      <FarmerDashboard
        weather={weather}
        historical={historicalData}
        alerts={alertsData}
        loading={loading}
        unit={unit}
        language={language}
        onRefresh={onRefresh}
        onAskAssistant={onAskAssistant}
        onOpenAlerts={onOpenAlerts}
      />
    );
  }

  if (userType === 'disaster') {
    return (
      <DisasterManagerDashboard
        weather={weather}
        alerts={alertsData}
        stations={stationsData}
        loading={loading}
        unit={unit}
        language={language}
        onRefresh={onRefresh}
        onSelectLocation={onQuickCity}
        onOpenAlerts={onOpenAlerts}
      />
    );
  }

  return (
    <CitizenDashboard
      weather={weather}
      alerts={alertsData}
      loading={loading}
      unit={unit}
      language={language}
      quickCities={QUICK_CITIES}
      onRefresh={onRefresh}
      onQuickCity={onQuickCity}
      onAskAssistant={onAskAssistant}
      onOpenAlerts={onOpenAlerts}
    />
  );
}
