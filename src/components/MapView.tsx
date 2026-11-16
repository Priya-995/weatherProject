import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Droplets, MapPin, RefreshCw, Thermometer, Wind } from 'lucide-react';
import { getDict, translateCondition, translateWindDir } from '../i18n/translations.ts';
import type {
  LocationResult,
  MapStationPoint,
  NormalizedWeatherResponse,
  UILanguageCode,
} from '../types/weather.ts';
import { formatTemp, formatTimestamp, type TempUnit } from '../utils/weatherFormat.ts';
import { LocationSearch } from './LocationSearch.tsx';

interface MapViewProps {
  selectedLocation: LocationResult;
  onSelectLocation: (loc: LocationResult) => void;
  unit: TempUnit;
  language: UILanguageCode;
}

type MapLayerMode = 'temperature' | 'rainfall';

export function MapView({ selectedLocation, onSelectLocation, unit, language }: MapViewProps) {
  const dict = getDict(language);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [layerMode, setLayerMode] = useState<MapLayerMode>('temperature');
  const [stations, setStations] = useState<MapStationPoint[]>([]);
  const [focusedDetail, setFocusedDetail] = useState<NormalizedWeatherResponse | null>(null);
  const [loadingStations, setLoadingStations] = useState(true);
  const [loadingPoint, setLoadingPoint] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStations = async (loc: LocationResult) => {
    setLoadingStations(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        lat: String(loc.latitude),
        lon: String(loc.longitude),
        name: loc.name,
        country: loc.country,
      });
      const res = await fetch(`/api/map/stations?${params.toString()}`);
      if (!res.ok) throw new Error('Unable to load Open-Meteo map station observations.');
      const json = (await res.json()) as { stations: MapStationPoint[] };
      setStations(json.stations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Map stations unavailable.');
    } finally {
      setLoadingStations(false);
    }
  };

  const loadPointWeather = async (loc: LocationResult) => {
    setLoadingPoint(true);
    try {
      const params = new URLSearchParams({
        lat: String(loc.latitude),
        lon: String(loc.longitude),
        name: loc.name,
        country: loc.country,
      });
      if (loc.admin1) params.set('admin1', loc.admin1);
      const res = await fetch(`/api/weather?${params.toString()}`);
      if (res.ok) {
        const json = (await res.json()) as NormalizedWeatherResponse;
        setFocusedDetail(json);
      }
    } finally {
      setLoadingPoint(false);
    }
  };

  useEffect(() => {
    loadStations(selectedLocation);
    loadPointWeather(selectedLocation);
  }, [selectedLocation.latitude, selectedLocation.longitude, selectedLocation.name]);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [selectedLocation.latitude, selectedLocation.longitude],
      zoom: 5,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    markersLayerRef.current = layerGroup;

    map.on('click', (e: L.LeafletMouseEvent) => {
      const clickedLoc: LocationResult = {
        name: `Point (${e.latlng.lat.toFixed(2)}, ${e.latlng.lng.toFixed(2)})`,
        country: 'Coordinates',
        latitude: e.latlng.lat,
        longitude: e.latlng.lng,
      };
      loadPointWeather(clickedLoc);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([selectedLocation.latitude, selectedLocation.longitude], 6, {
        animate: true,
      });
    }
  }, [selectedLocation.latitude, selectedLocation.longitude]);

  useEffect(() => {
    const group = markersLayerRef.current;
    if (!group) return;
    group.clearLayers();

    for (const st of stations) {
      const isTemp = layerMode === 'temperature';
      const tempC = st.temperature_c;
      const rainProb = st.rain_probability_percent ?? 0;

      const color = isTemp
        ? tempC >= 36
          ? '#dc2626'
          : tempC >= 28
          ? '#d97706'
          : tempC >= 18
          ? '#0284c7'
          : '#2563eb'
        : st.precipitation_mm > 2 || rainProb >= 60
        ? '#0284c7'
        : rainProb >= 25
        ? '#38bdf8'
        : '#64748b';

      const valueLabel = isTemp
        ? formatTemp(tempC, unit, 0)
        : `${st.precipitation_mm.toFixed(1)}mm · ${rainProb}%`;

      L.circle([st.location.latitude, st.location.longitude], {
        radius: isTemp ? 85000 : 75000,
        color,
        weight: 1,
        opacity: 0.45,
        fillColor: color,
        fillOpacity: isTemp ? 0.14 : Math.min(0.1 + rainProb / 250, 0.45),
      }).addTo(group);

      const icon = L.divIcon({
        className: 'weather-station-div-icon',
        html: `<div style="background:${color};color:#fff;padding:3px 7px;border-radius:6px;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.28);border:1px solid rgba(255,255,255,0.35);">${st.location.name} ${valueLabel}</div>`,
        iconSize: [0, 0],
        iconAnchor: [40, 12],
      });

      const marker = L.marker([st.location.latitude, st.location.longitude], { icon }).addTo(group);
      marker.on('click', () => {
        loadPointWeather(st.location);
      });
    }
  }, [stations, layerMode, unit]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[260px]">
          <LocationSearch
            selectedLocation={selectedLocation}
            onSelectLocation={onSelectLocation}
            language={language}
            placeholder={dict.map.jumpPlaceholder}
          />
          <button
            type="button"
            onClick={() => loadStations(selectedLocation)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingStations ? 'animate-spin' : ''}`} />
            <span>{dict.map.refreshStations}</span>
          </button>
        </div>

        <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setLayerMode('temperature')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              layerMode === 'temperature'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Thermometer className="h-3.5 w-3.5" />
            <span>{dict.map.tempLayer}</span>
          </button>
          <button
            type="button"
            onClick={() => setLayerMode('rainfall')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
              layerMode === 'rainfall'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Droplets className="h-3.5 w-3.5" />
            <span>{dict.map.rainLayer}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 px-4 py-2.5 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden min-h-[520px] relative">
          <div ref={mapContainerRef} className="w-full h-[520px]" />
          <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2">
            <span>{dict.map.footerSource}</span>
            <span>{dict.map.footerHint}</span>
          </div>
        </div>

        <aside className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between">
          {loadingPoint && !focusedDetail ? (
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {dict.map.loadingPoint}
            </div>
          ) : focusedDetail ? (
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <MapPin className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                  <span className="font-mono tabular-nums">
                    {focusedDetail.location.latitude.toFixed(3)}°,{' '}
                    {focusedDetail.location.longitude.toFixed(3)}°
                  </span>
                </div>
                <h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
                  {focusedDetail.location.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {[focusedDetail.location.admin1, focusedDetail.location.country]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>

              <div className="py-4 border-y border-slate-200 dark:border-slate-800 flex items-baseline justify-between">
                <div className="text-4xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {formatTemp(focusedDetail.current.temperature_c, unit, 1)}
                </div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {translateCondition(focusedDetail.current.condition_label, language)}
                </div>
              </div>

              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">{dict.common.feelsLike}</dt>
                  <dd className="font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">
                    {formatTemp(focusedDetail.current.feels_like_c, unit, 1)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">{dict.common.humidity}</dt>
                  <dd className="font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">
                    {focusedDetail.current.humidity_percent}%
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Wind className="h-3.5 w-3.5" /> {dict.map.windLabel}
                  </dt>
                  <dd className="font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">
                    {focusedDetail.current.wind_speed_kmh.toFixed(1)} km/h{' '}
                    {translateWindDir(focusedDetail.current.wind_direction_cardinal, language)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">
                    {dict.common.rainProbability}
                  </dt>
                  <dd className="font-mono tabular-nums font-medium text-sky-600 dark:text-sky-400">
                    {focusedDetail.current.rain_probability_percent != null
                      ? `${focusedDetail.current.rain_probability_percent}%`
                      : '—'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">
                    {dict.common.precipitation}
                  </dt>
                  <dd className="font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">
                    {focusedDetail.current.precipitation_mm.toFixed(1)} mm
                  </dd>
                </div>
              </dl>

              <div className="pt-2 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                <div>
                  {dict.common.source}: {focusedDetail.current.source}
                </div>
                <div className="font-mono tabular-nums">
                  {dict.common.updated} {formatTimestamp(focusedDetail.last_updated, language)}
                </div>
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => {
              if (focusedDetail) {
                onSelectLocation(focusedDetail.location);
              }
            }}
            className="mt-6 w-full rounded-lg bg-sky-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-sky-700 transition-colors"
          >
            {dict.map.setActiveBtn}
          </button>
        </aside>
      </div>
    </div>
  );
}
