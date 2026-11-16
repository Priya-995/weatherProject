/// <reference types="google.maps" />
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  APIProvider,
  APILoadingStatus,
  AdvancedMarker,
  CollisionBehavior,
  InfoWindow,
  Map as GoogleMap,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  AlertTriangle,
  Box,
  Droplets,
  Layers,
  MapPin,
  RefreshCw,
  Search,
  Thermometer,
  Wind,
} from 'lucide-react';
import { getFeatureDict } from '../i18n/featureTranslations.ts';
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
  theme: 'light' | 'dark';
  onOpen3dScene?: () => void;
}

type MapLayerMode = 'temperature' | 'rainfall';
type GoogleMapTypeId = 'roadmap' | 'satellite' | 'hybrid' | 'terrain';

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

function isQuotaError(err: unknown): boolean {
  const msg =
    err instanceof Error
      ? err.message
      : typeof err === 'object' && err !== null
      ? JSON.stringify(err)
      : String(err ?? '');
  return (
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('OVER_QUERY_LIMIT') ||
    msg.includes('QuotaExceededError') ||
    msg.includes('OverQuotaMapError') ||
    msg.includes('429')
  );
}

function getStationColor(st: MapStationPoint, layerMode: MapLayerMode): string {
  const isTemp = layerMode === 'temperature';
  const tempC = st.temperature_c;
  const rainProb = st.rain_probability_percent ?? 0;

  if (isTemp) {
    if (tempC >= 36) return '#dc2626';
    if (tempC >= 28) return '#d97706';
    if (tempC >= 18) return '#0284c7';
    return '#2563eb';
  }
  if (st.precipitation_mm > 2 || rainProb >= 60) return '#0284c7';
  if (rainProb >= 25) return '#0ea5e9';
  return '#475569';
}

interface GooglePlacesAutocompleteBarProps {
  placeholder: string;
  searchingLabel: string;
  onSelectLocation: (loc: LocationResult) => void;
}

function GooglePlacesAutocompleteBar({
  placeholder,
  searchingLabel,
  onSelectLocation,
}: GooglePlacesAutocompleteBarProps) {
  const placesLib = useMapsLibrary('places');
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const resetSession = useCallback(() => {
    sessionTokenRef.current = null;
    setSuggestions([]);
    setDropdownOpen(false);
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    if (!placesLib) return;
    const trimmed = inputValue.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const { AutocompleteSessionToken, AutocompleteSuggestion } = placesLib;
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new AutocompleteSessionToken();
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: trimmed,
          sessionToken: sessionTokenRef.current || undefined,
        });
        if (!cancelled) {
          setSuggestions(res.suggestions || []);
          setDropdownOpen(true);
        }
      } catch (err) {
        if (isQuotaError(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        if (!cancelled) {
          setSuggestions([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [placesLib, inputValue]);

  const handleSelectSuggestion = useCallback(
    async (suggestion: google.maps.places.AutocompleteSuggestion) => {
      if (!placesLib || !suggestion.placePrediction) return;
      try {
        const place = suggestion.placePrediction.toPlace();
        await place.fetchFields({
          fields: ['displayName', 'formattedAddress', 'location', 'addressComponents'],
        });
        if (place.location) {
          const lat = place.location.lat();
          const lng = place.location.lng();
          const name =
            place.displayName ||
            suggestion.placePrediction.mainText?.text ||
            suggestion.placePrediction.text.text;
          const components = place.addressComponents || [];
          const adminComp = components.find((c) =>
            c.types.includes('administrative_area_level_1')
          );
          const countryComp = components.find((c) => c.types.includes('country'));
          onSelectLocation({
            name,
            admin1: adminComp?.longText || undefined,
            country: countryComp?.longText || place.formattedAddress || 'Selected Place',
            country_code: countryComp?.shortText || undefined,
            latitude: lat,
            longitude: lng,
          });
        }
        setInputValue('');
        resetSession();
      } catch (err) {
        if (isQuotaError(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
      }
    },
    [placesLib, onSelectLocation, resetSession]
  );

  return (
    <div ref={containerRef} className="relative flex-1 min-w-[240px] max-w-md">
      <div className="relative flex items-center">
        <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setDropdownOpen(true);
          }}
          placeholder={placeholder}
          aria-label={placeholder}
          className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-8 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-sky-500"
        />
      </div>

      {dropdownOpen && (isLoading || suggestions.length > 0) && (
        <div className="absolute left-0 right-0 top-10 z-30 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
          {isLoading ? (
            <div className="px-3 py-2.5 text-xs text-slate-500 dark:text-slate-400">
              {searchingLabel}
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto">
              {suggestions.map((s, idx) => {
                const label = s.placePrediction?.text.text || '';
                if (!label) return null;
                return (
                  <li key={`${label}-${idx}`}>
                    <button
                      type="button"
                      onClick={() => void handleSelectSuggestion(s)}
                      className="w-full px-3 py-2 text-left text-xs text-slate-800 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-sky-950/40 flex items-center gap-2 transition-colors"
                    >
                      <MapPin className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                      <span className="truncate">{label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function MapCameraSync({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const prevRef = useRef<string>('');

  useEffect(() => {
    if (!map) return;
    const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (prevRef.current && prevRef.current !== key) {
      map.panTo({ lat, lng });
      const currentZoom = map.getZoom();
      if (typeof currentZoom === 'number' && currentZoom < 5) {
        map.setZoom(6);
      }
    }
    prevRef.current = key;
  }, [map, lat, lng]);

  return null;
}

function StationWeatherCircles({
  stations,
  layerMode,
}: {
  stations: MapStationPoint[];
  layerMode: MapLayerMode;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || typeof google === 'undefined' || !google.maps?.Circle) return;

    const circles: google.maps.Circle[] = stations.map((st) => {
      const isTemp = layerMode === 'temperature';
      const rainProb = st.rain_probability_percent ?? 0;
      const color = getStationColor(st, layerMode);

      return new google.maps.Circle({
        map,
        center: { lat: st.location.latitude, lng: st.location.longitude },
        radius: isTemp ? 85000 : 75000,
        strokeColor: color,
        strokeOpacity: 0.5,
        strokeWeight: 1.5,
        fillColor: color,
        fillOpacity: isTemp ? 0.16 : Math.min(0.12 + rainProb / 240, 0.45),
        clickable: false,
      });
    });

    return () => {
      for (const c of circles) {
        c.setMap(null);
      }
    };
  }, [map, stations, layerMode]);

  return null;
}

interface StationAdvancedMarkerProps {
  station: MapStationPoint;
  layerMode: MapLayerMode;
  unit: TempUnit;
  isSelected: boolean;
  zIndex: number;
  onSelect: (station: MapStationPoint, marker: google.maps.marker.AdvancedMarkerElement | null) => void;
}

function StationAdvancedMarker({
  station,
  layerMode,
  unit,
  isSelected,
  zIndex,
  onSelect,
}: StationAdvancedMarkerProps) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const color = getStationColor(station, layerMode);
  const rainProb = station.rain_probability_percent ?? 0;
  const valueLabel =
    layerMode === 'temperature'
      ? formatTemp(station.temperature_c, unit, 0)
      : `${station.precipitation_mm.toFixed(1)}mm · ${rainProb}%`;

  return (
    <AdvancedMarker
      ref={markerRef}
      position={{ lat: station.location.latitude, lng: station.location.longitude }}
      zIndex={zIndex}
      collisionBehavior={CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY}
      title={`${station.location.name}: ${valueLabel}`}
      onClick={() => onSelect(station, marker)}
    >
      <div
        style={{
          backgroundColor: color,
          borderColor: isSelected ? '#ffffff' : 'rgba(255,255,255,0.45)',
          transform: isSelected ? 'scale(1.08)' : 'scale(1)',
        }}
        className="px-2 py-1 rounded-md border text-[11px] font-mono font-semibold text-white shadow-md whitespace-nowrap cursor-pointer transition-transform"
      >
        {station.location.name} {valueLabel}
      </div>
    </AdvancedMarker>
  );
}

function ApiLoadingBanner({
  missingKeyTitle,
}: {
  missingKeyTitle: string;
}) {
  const status = useApiLoadingStatus();

  useEffect(() => {
    if (status === APILoadingStatus.AUTH_FAILURE) {
      window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
    }
  }, [status]);

  if (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE) {
    return (
      <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        <span>{missingKeyTitle}</span>
      </div>
    );
  }
  return null;
}

export function MapView({
  selectedLocation,
  onSelectLocation,
  unit,
  language,
  theme,
  onOpen3dScene,
}: MapViewProps) {
  const dict = getDict(language);
  const fDict = getFeatureDict(language);

  const [layerMode, setLayerMode] = useState<MapLayerMode>('temperature');
  const [mapTypeId, setMapTypeId] = useState<GoogleMapTypeId>('roadmap');
  const [stations, setStations] = useState<MapStationPoint[]>([]);
  const [focusedDetail, setFocusedDetail] = useState<NormalizedWeatherResponse | null>(null);
  const [loadingStations, setLoadingStations] = useState(true);
  const [loadingPoint, setLoadingPoint] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [infoStation, setInfoStation] = useState<MapStationPoint | null>(null);
  const [infoMarker, setInfoMarker] =
    useState<google.maps.marker.AdvancedMarkerElement | null>(null);

  const loadStations = useCallback(async (loc: LocationResult) => {
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
  }, []);

  const loadPointWeather = useCallback(async (loc: LocationResult) => {
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
  }, []);

  useEffect(() => {
    loadStations(selectedLocation);
    loadPointWeather(selectedLocation);
    setInfoStation(null);
    setInfoMarker(null);
  }, [
    selectedLocation.latitude,
    selectedLocation.longitude,
    selectedLocation.name,
    loadStations,
    loadPointWeather,
  ]);

  const handleStationSelect = useCallback(
    (station: MapStationPoint, marker: google.maps.marker.AdvancedMarkerElement | null) => {
      setInfoStation(station);
      setInfoMarker(marker);
      void loadPointWeather(station.location);
    },
    [loadPointWeather]
  );

  const sortedStations = [...stations].sort(
    (a, b) => b.location.latitude - a.location.latitude
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[260px]">
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

          {onOpen3dScene && (
            <button
              type="button"
              onClick={onOpen3dScene}
              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 px-3 py-2 text-xs font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-950/60 transition-colors whitespace-nowrap shrink-0"
            >
              <Box className="h-3.5 w-3.5" />
              <span>{fDict.googleMaps.open3dSceneBtn}</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Map Type Selector */}
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800">
            <Layers className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 mx-1.5 shrink-0" />
            {(
              [
                ['roadmap', fDict.googleMaps.mapTypeRoadmap],
                ['satellite', fDict.googleMaps.mapTypeSatellite],
                ['hybrid', fDict.googleMaps.mapTypeHybrid],
                ['terrain', fDict.googleMaps.mapTypeTerrain],
              ] as const
            ).map(([typeKey, label]) => (
              <button
                key={typeKey}
                type="button"
                onClick={() => setMapTypeId(typeKey)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  mapTypeId === typeKey
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Temperature / Rainfall Layer Toggle */}
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
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 px-4 py-2.5 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col">
          {MAPS_API_KEY ? (
            <APIProvider
              apiKey={MAPS_API_KEY}
              language={language}
              region="IN"
              libraries={['places', 'marker']}
            >
              <ApiLoadingBanner missingKeyTitle={fDict.googleMaps.missingKeyTitle} />

              <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
                <GooglePlacesAutocompleteBar
                  placeholder={fDict.googleMaps.placesPlaceholder}
                  searchingLabel={fDict.googleMaps.searchingPlaces}
                  onSelectLocation={onSelectLocation}
                />
                <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  {stations.length} {fDict.googleMaps.stationsShown}
                </div>
              </div>

              <div className="w-full h-[520px] relative">
                <GoogleMap
                  mapId="DEMO_MAP_ID"
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  colorScheme={theme === 'dark' ? 'DARK' : 'LIGHT'}
                  mapTypeId={mapTypeId}
                  defaultCenter={{
                    lat: selectedLocation.latitude,
                    lng: selectedLocation.longitude,
                  }}
                  defaultZoom={6}
                  gestureHandling="greedy"
                  streetViewControl={false}
                  mapTypeControl={false}
                  fullscreenControl={true}
                  style={{ width: '100%', height: '100%' }}
                  onClick={(e) => {
                    const latLng = e.detail?.latLng;
                    if (!latLng) return;
                    setInfoStation(null);
                    setInfoMarker(null);
                    void loadPointWeather({
                      name: `Point (${latLng.lat.toFixed(2)}, ${latLng.lng.toFixed(2)})`,
                      country: 'Coordinates',
                      latitude: latLng.lat,
                      longitude: latLng.lng,
                    });
                  }}
                >
                  <MapCameraSync
                    lat={selectedLocation.latitude}
                    lng={selectedLocation.longitude}
                  />
                  <StationWeatherCircles stations={stations} layerMode={layerMode} />

                  {sortedStations.map((st, idx) => {
                    const isSelected = infoStation?.location.name === st.location.name;
                    return (
                      <StationAdvancedMarker
                        key={`${st.location.name}-${st.location.latitude}-${st.location.longitude}`}
                        station={st}
                        layerMode={layerMode}
                        unit={unit}
                        isSelected={isSelected}
                        zIndex={isSelected ? 1000 : idx + 1}
                        onSelect={handleStationSelect}
                      />
                    );
                  })}

                  {infoStation && infoMarker && (
                    <InfoWindow
                      anchor={infoMarker}
                      pixelOffset={[0, -6]}
                      onCloseClick={() => {
                        setInfoStation(null);
                        setInfoMarker(null);
                      }}
                    >
                      <div className="min-w-[200px] p-1 text-slate-900 space-y-1.5">
                        <div className="font-bold text-sm">{infoStation.location.name}</div>
                        <div className="text-xs text-slate-600">
                          {translateCondition(infoStation.condition_label, language)}
                        </div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs pt-1 border-t border-slate-200 font-mono tabular-nums">
                          <span>{formatTemp(infoStation.temperature_c, unit, 1)}</span>
                          <span>{infoStation.humidity_percent}% RH</span>
                          <span>{infoStation.wind_speed_kmh.toFixed(1)} km/h</span>
                          <span>
                            {infoStation.rain_probability_percent != null
                              ? `${infoStation.rain_probability_percent}%`
                              : `${infoStation.precipitation_mm.toFixed(1)} mm`}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onSelectLocation(infoStation.location)}
                          className="mt-1.5 w-full rounded bg-sky-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-sky-700"
                        >
                          {dict.map.setActiveBtn}
                        </button>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              </div>
            </APIProvider>
          ) : (
            <div className="h-[520px] flex flex-col items-center justify-center p-8 text-center space-y-3 bg-slate-50 dark:bg-slate-950/40">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {fDict.googleMaps.missingKeyTitle}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md">
                {fDict.googleMaps.missingKeyBody}
              </p>
            </div>
          )}

          <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2">
            <span>{fDict.googleMaps.providerAttribution}</span>
            <span>{fDict.googleMaps.clickMapHint}</span>
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
