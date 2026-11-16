import type {
  AlertLifecycleStatus,
  AlertsResponse,
  CurrentWeather,
  DailyPoint,
  HistoricalDailyPoint,
  HistoricalWeatherResponse,
  HourlyPoint,
  LocationResult,
  MapStationPoint,
  MeteorologicalAdvisory,
  NormalizedWeatherResponse,
  OfficialAlert,
  RegionalDistrictReport,
  RegionalOverviewResponse,
} from '../src/types/weather.ts';
import { getDistrictsForState } from '../src/data/indiaRegions.ts';

const REQUEST_TIMEOUT_MS = 10000;

export const INDIA_HUB_LOCATIONS: LocationResult[] = [
  { id: 'in-ahm', name: 'Ahmedabad', admin1: 'Gujarat', country: 'India', country_code: 'IN', latitude: 23.0225, longitude: 72.5714, timezone: 'Asia/Kolkata' },
  { id: 'in-del', name: 'Delhi', admin1: 'Delhi', country: 'India', country_code: 'IN', latitude: 28.6139, longitude: 77.209, timezone: 'Asia/Kolkata' },
  { id: 'in-mum', name: 'Mumbai', admin1: 'Maharashtra', country: 'India', country_code: 'IN', latitude: 19.076, longitude: 72.8777, timezone: 'Asia/Kolkata' },
  { id: 'in-lko', name: 'Lucknow', admin1: 'Uttar Pradesh', country: 'India', country_code: 'IN', latitude: 26.8467, longitude: 80.9462, timezone: 'Asia/Kolkata' },
  { id: 'in-blr', name: 'Bengaluru', admin1: 'Karnataka', country: 'India', country_code: 'IN', latitude: 12.9716, longitude: 77.5946, timezone: 'Asia/Kolkata' },
  { id: 'in-che', name: 'Chennai', admin1: 'Tamil Nadu', country: 'India', country_code: 'IN', latitude: 13.0827, longitude: 80.2707, timezone: 'Asia/Kolkata' },
  { id: 'in-kol', name: 'Kolkata', admin1: 'West Bengal', country: 'India', country_code: 'IN', latitude: 22.5726, longitude: 88.3639, timezone: 'Asia/Kolkata' },
  { id: 'in-hyd', name: 'Hyderabad', admin1: 'Telangana', country: 'India', country_code: 'IN', latitude: 17.385, longitude: 78.4867, timezone: 'Asia/Kolkata' },
  { id: 'in-jai', name: 'Jaipur', admin1: 'Rajasthan', country: 'India', country_code: 'IN', latitude: 26.9124, longitude: 75.7873, timezone: 'Asia/Kolkata' },
  { id: 'in-pun', name: 'Pune', admin1: 'Maharashtra', country: 'India', country_code: 'IN', latitude: 18.5204, longitude: 73.8567, timezone: 'Asia/Kolkata' },
  { id: 'in-pat', name: 'Patna', admin1: 'Bihar', country: 'India', country_code: 'IN', latitude: 25.5941, longitude: 85.1376, timezone: 'Asia/Kolkata' },
  { id: 'in-vns', name: 'Varanasi', admin1: 'Uttar Pradesh', country: 'India', country_code: 'IN', latitude: 25.3176, longitude: 82.9739, timezone: 'Asia/Kolkata' },
  { id: 'in-bho', name: 'Bhopal', admin1: 'Madhya Pradesh', country: 'India', country_code: 'IN', latitude: 23.2599, longitude: 77.4126, timezone: 'Asia/Kolkata' },
  { id: 'in-guw', name: 'Guwahati', admin1: 'Assam', country: 'India', country_code: 'IN', latitude: 26.1445, longitude: 91.7362, timezone: 'Asia/Kolkata' },
  { id: 'in-chd', name: 'Chandigarh', admin1: 'Chandigarh', country: 'India', country_code: 'IN', latitude: 30.7333, longitude: 76.7794, timezone: 'Asia/Kolkata' },
  { id: 'in-koc', name: 'Kochi', admin1: 'Kerala', country: 'India', country_code: 'IN', latitude: 9.9312, longitude: 76.2673, timezone: 'Asia/Kolkata' },
];

export function degreesToCardinal(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const idx = Math.round((((deg % 360) + 360) % 360) / 22.5) % 16;
  return dirs[idx];
}

export function wmoCodeToCondition(code: number): string {
  const map: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  return map[code] ?? 'Variable conditions';
}

async function fetchJsonWithTimeout<T>(url: string, timeoutMs = REQUEST_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} from ${new URL(url).hostname}: ${text.slice(0, 180)}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function searchLocations(query: string): Promise<LocationResult[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return INDIA_HUB_LOCATIONS.slice(0, 8);
  }

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=8&language=en&format=json`;
  try {
    const data = await fetchJsonWithTimeout<{ results?: Array<Record<string, unknown>> }>(url);
    if (Array.isArray(data.results) && data.results.length > 0) {
      return data.results.map((item) => ({
        id: item.id as number,
        name: String(item.name ?? ''),
        admin1: item.admin1 ? String(item.admin1) : undefined,
        country: String(item.country ?? ''),
        country_code: item.country_code ? String(item.country_code) : undefined,
        latitude: Number(item.latitude),
        longitude: Number(item.longitude),
        timezone: item.timezone ? String(item.timezone) : 'auto',
      }));
    }
  } catch (err) {
    // Fallback to matching local Indian coordinate index only for lookup
    const lower = trimmed.toLowerCase();
    const matched = INDIA_HUB_LOCATIONS.filter(
      (loc) =>
        loc.name.toLowerCase().includes(lower) ||
        (loc.admin1 && loc.admin1.toLowerCase().includes(lower))
    );
    if (matched.length > 0) {
      return matched;
    }
    throw err;
  }

  const lower = trimmed.toLowerCase();
  return INDIA_HUB_LOCATIONS.filter(
    (loc) =>
      loc.name.toLowerCase().includes(lower) ||
      (loc.admin1 && loc.admin1.toLowerCase().includes(lower))
  );
}

export async function resolveLocation(nameOrQuery: string): Promise<LocationResult> {
  const trimmed = nameOrQuery.trim();
  if (!trimmed) {
    return INDIA_HUB_LOCATIONS[0];
  }
  const exactHub = INDIA_HUB_LOCATIONS.find(
    (loc) => loc.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (exactHub) {
    return exactHub;
  }
  const results = await searchLocations(trimmed);
  if (results.length === 0) {
    throw new Error(`Location "${nameOrQuery}" not found via Open-Meteo geocoding.`);
  }
  return results[0];
}

export async function fetchNormalizedWeather(
  location: LocationResult,
  model: 'best_match' | 'gfs_seamless' = 'best_match'
): Promise<NormalizedWeatherResponse> {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'is_day',
      'precipitation',
      'weather_code',
      'cloud_cover',
      'surface_pressure',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
    ].join(','),
    hourly: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'precipitation_probability',
      'precipitation',
      'weather_code',
      'wind_speed_10m',
      'wind_direction_10m',
      'visibility',
      'uv_index',
    ].join(','),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'sunrise',
      'sunset',
      'uv_index_max',
      'precipitation_sum',
      'precipitation_probability_max',
      'wind_speed_10m_max',
    ].join(','),
    timezone: location.timezone || 'auto',
    forecast_days: '7',
  });

  if (model === 'gfs_seamless') {
    params.set('models', 'gfs_seamless');
  }

  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  const raw = await fetchJsonWithTimeout<{
    timezone?: string;
    current?: Record<string, number | string>;
    hourly?: Record<string, Array<number | string | null>>;
    daily?: Record<string, Array<number | string | null>>;
  }>(url);

  const cur = raw.current ?? {};
  const hourlyRaw = raw.hourly ?? {};
  const dailyRaw = raw.daily ?? {};

  const times = (hourlyRaw.time as string[]) ?? [];
  const currentObsTime = String(cur.time ?? times[0] ?? new Date().toISOString());

  // Find closest hourly index for current rain probability, visibility, UV
  let currentHourIdx = times.findIndex((t) => t.slice(0, 13) === currentObsTime.slice(0, 13));
  if (currentHourIdx < 0) currentHourIdx = 0;

  const hourly: HourlyPoint[] = times.slice(0, 48).map((t, idx) => {
    const wmo = Number((hourlyRaw.weather_code?.[idx] as number) ?? 0);
    return {
      time: t,
      temperature_c: Number((hourlyRaw.temperature_2m?.[idx] as number) ?? 0),
      feels_like_c: Number((hourlyRaw.apparent_temperature?.[idx] as number) ?? 0),
      humidity_percent: Number((hourlyRaw.relative_humidity_2m?.[idx] as number) ?? 0),
      rain_probability_percent: Number((hourlyRaw.precipitation_probability?.[idx] as number) ?? 0),
      precipitation_mm: Number((hourlyRaw.precipitation?.[idx] as number) ?? 0),
      wind_speed_kmh: Number((hourlyRaw.wind_speed_10m?.[idx] as number) ?? 0),
      wind_direction_deg: Number((hourlyRaw.wind_direction_10m?.[idx] as number) ?? 0),
      weather_code: wmo,
      condition_label: wmoCodeToCondition(wmo),
    };
  });

  const dailyTimes = (dailyRaw.time as string[]) ?? [];
  const daily: DailyPoint[] = dailyTimes.map((d, idx) => {
    const wmo = Number((dailyRaw.weather_code?.[idx] as number) ?? 0);
    return {
      date: d,
      temp_max_c: Number((dailyRaw.temperature_2m_max?.[idx] as number) ?? 0),
      temp_min_c: Number((dailyRaw.temperature_2m_min?.[idx] as number) ?? 0),
      rain_probability_max_percent: Number((dailyRaw.precipitation_probability_max?.[idx] as number) ?? 0),
      precipitation_sum_mm: Number((dailyRaw.precipitation_sum?.[idx] as number) ?? 0),
      wind_speed_max_kmh: Number((dailyRaw.wind_speed_10m_max?.[idx] as number) ?? 0),
      uv_index_max: dailyRaw.uv_index_max?.[idx] != null ? Number(dailyRaw.uv_index_max[idx]) : null,
      sunrise: String(dailyRaw.sunrise?.[idx] ?? ''),
      sunset: String(dailyRaw.sunset?.[idx] ?? ''),
      weather_code: wmo,
      condition_label: wmoCodeToCondition(wmo),
    };
  });

  const curWmo = Number(cur.weather_code ?? 0);
  const windDeg = Number(cur.wind_direction_10m ?? 0);
  const visMeters = hourlyRaw.visibility?.[currentHourIdx];

  const current: CurrentWeather = {
    temperature_c: Number(cur.temperature_2m ?? 0),
    feels_like_c: Number(cur.apparent_temperature ?? cur.temperature_2m ?? 0),
    humidity_percent: Number(cur.relative_humidity_2m ?? 0),
    wind_speed_kmh: Number(cur.wind_speed_10m ?? 0),
    wind_direction_deg: windDeg,
    wind_direction_cardinal: degreesToCardinal(windDeg),
    wind_gusts_kmh: cur.wind_gusts_10m != null ? Number(cur.wind_gusts_10m) : null,
    precipitation_mm: Number(cur.precipitation ?? 0),
    rain_probability_percent:
      hourlyRaw.precipitation_probability?.[currentHourIdx] != null
        ? Number(hourlyRaw.precipitation_probability[currentHourIdx])
        : null,
    weather_code: curWmo,
    condition_label: wmoCodeToCondition(curWmo),
    is_day: Number(cur.is_day ?? 1) === 1,
    pressure_hpa: cur.surface_pressure != null ? Number(cur.surface_pressure) : null,
    cloud_cover_percent: cur.cloud_cover != null ? Number(cur.cloud_cover) : null,
    visibility_km: visMeters != null ? Math.round((Number(visMeters) / 1000) * 10) / 10 : null,
    uv_index:
      hourlyRaw.uv_index?.[currentHourIdx] != null
        ? Number(hourlyRaw.uv_index[currentHourIdx])
        : null,
    sunrise: daily[0]?.sunrise ?? null,
    sunset: daily[0]?.sunset ?? null,
    observed_at: currentObsTime,
    source: model === 'gfs_seamless' ? 'Open-Meteo GFS Seamless' : 'Open-Meteo Forecast API',
  };

  return {
    location: {
      ...location,
      timezone: raw.timezone || location.timezone || 'Asia/Kolkata',
    },
    current,
    hourly,
    daily,
    model,
    sources: [
      {
        name: model === 'gfs_seamless' ? 'Open-Meteo (GFS Seamless)' : 'Open-Meteo Forecast',
        status: 'available',
        detail: 'Live meteorological model observation and 7-day forecast',
      },
    ],
    last_updated: new Date().toISOString(),
  };
}

export async function fetchHistoricalWeather(
  location: LocationResult,
  days = 14
): Promise<HistoricalWeatherResponse> {
  const safeDays = Math.min(Math.max(days, 7), 60);
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 3);
  const start = new Date(end);
  start.setUTCDate(end.getUTCDate() - (safeDays - 1));

  const formatDate = (d: Date) => d.toISOString().slice(0, 10);
  const startDate = formatDate(start);
  const endDate = formatDate(end);

  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    start_date: startDate,
    end_date: endDate,
    daily: [
      'temperature_2m_max',
      'temperature_2m_min',
      'temperature_2m_mean',
      'precipitation_sum',
      'wind_speed_10m_max',
    ].join(','),
    timezone: location.timezone || 'auto',
  });

  const url = `https://archive-api.open-meteo.com/v1/archive?${params.toString()}`;
  const raw = await fetchJsonWithTimeout<{
    daily?: Record<string, Array<number | string | null>>;
  }>(url);

  const dailyRaw = raw.daily ?? {};
  const dates = (dailyRaw.time as string[]) ?? [];

  const daily: HistoricalDailyPoint[] = dates.map((d, i) => ({
    date: d,
    temp_max_c: Number((dailyRaw.temperature_2m_max?.[i] as number) ?? 0),
    temp_min_c: Number((dailyRaw.temperature_2m_min?.[i] as number) ?? 0),
    temp_mean_c: Number((dailyRaw.temperature_2m_mean?.[i] as number) ?? 0),
    precipitation_sum_mm: Number((dailyRaw.precipitation_sum?.[i] as number) ?? 0),
    wind_speed_max_kmh: Number((dailyRaw.wind_speed_10m_max?.[i] as number) ?? 0),
  }));

  return {
    location,
    start_date: startDate,
    end_date: endDate,
    daily,
    source: 'Open-Meteo Historical Archive (ERA5 Reanalysis)',
    last_updated: new Date().toISOString(),
  };
}

export async function fetchMapStations(extraLocation?: LocationResult): Promise<MapStationPoint[]> {
  const stations = [...INDIA_HUB_LOCATIONS];
  if (
    extraLocation &&
    !stations.some(
      (s) =>
        Math.abs(s.latitude - extraLocation.latitude) < 0.05 &&
        Math.abs(s.longitude - extraLocation.longitude) < 0.05
    )
  ) {
    stations.unshift(extraLocation);
  }

  const lats = stations.map((s) => s.latitude.toFixed(4)).join(',');
  const lons = stations.map((s) => s.longitude.toFixed(4)).join(',');

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=precipitation_probability&forecast_days=1&timezone=Asia/Kolkata`;

  const raw = await fetchJsonWithTimeout<Array<{
    current?: Record<string, number | string>;
    hourly?: Record<string, Array<number | string | null>>;
  }> | {
    current?: Record<string, number | string>;
    hourly?: Record<string, Array<number | string | null>>;
  }>(url);

  const list = Array.isArray(raw) ? raw : [raw];
  return stations.map((loc, idx) => {
    const entry = list[idx] ?? {};
    const cur = entry.current ?? {};
    const wmo = Number(cur.weather_code ?? 0);
    const rainProb = entry.hourly?.precipitation_probability?.[0];
    return {
      location: loc,
      temperature_c: Number(cur.temperature_2m ?? 0),
      feels_like_c: Number(cur.apparent_temperature ?? cur.temperature_2m ?? 0),
      humidity_percent: Number(cur.relative_humidity_2m ?? 0),
      wind_speed_kmh: Number(cur.wind_speed_10m ?? 0),
      precipitation_mm: Number(cur.precipitation ?? 0),
      rain_probability_percent: rainProb != null ? Number(rainProb) : null,
      weather_code: wmo,
      condition_label: wmoCodeToCondition(wmo),
      observed_at: String(cur.time ?? new Date().toISOString()),
      source: 'Open-Meteo Multi-Point API',
    };
  });
}

function classifyAlertEvent(text: string): OfficialAlert['event_type'] {
  const lower = text.toLowerCase();
  if (lower.includes('cyclone') || lower.includes('depression')) return 'Cyclone';
  if (lower.includes('heat')) return 'Heatwave';
  if (lower.includes('thunder') || lower.includes('lightning')) return 'Thunderstorm';
  if (lower.includes('rain') || lower.includes('flood')) return 'Heavy Rainfall';
  if (lower.includes('wind') || lower.includes('squall') || lower.includes('gale')) return 'Strong Winds';
  return 'Weather Warning';
}

function classifySeverity(rawColorOrText: string, rawSeverityLevel?: string): {
  severity: OfficialAlert['severity'];
  rank: number;
  officialLabel: string;
} {
  const combined = `${rawColorOrText} ${rawSeverityLevel ?? ''}`.toLowerCase();
  const officialLabel = [rawSeverityLevel, rawColorOrText].filter(Boolean).join(' · ') || 'Official Bulletin';
  if (combined.includes('red') || combined.includes('extreme') || combined.includes('warning')) {
    return { severity: 'Red', rank: 5, officialLabel };
  }
  if (combined.includes('orange')) {
    return { severity: 'Orange', rank: 4, officialLabel };
  }
  if (combined.includes('yellow')) {
    return { severity: 'Yellow', rank: 3, officialLabel };
  }
  if (combined.includes('alert')) {
    return { severity: 'Alert', rank: 3, officialLabel };
  }
  if (combined.includes('watch')) {
    return { severity: 'Watch', rank: 2, officialLabel };
  }
  return { severity: 'Advisory', rank: 1, officialLabel };
}

function computeAlertLifecycle(validFrom: string | null, validUntil: string | null): AlertLifecycleStatus {
  const nowMs = Date.now();
  const fromMs = validFrom ? Date.parse(validFrom) : NaN;
  const untilMs = validUntil ? Date.parse(validUntil) : NaN;
  if (!Number.isNaN(untilMs) && nowMs > untilMs) {
    return 'expired';
  }
  if (!Number.isNaN(fromMs) && nowMs < fromMs) {
    return 'upcoming';
  }
  return 'active';
}

function extractStateFromText(area: string, authority: string, msg: string): string | undefined {
  const haystack = `${area} ${authority} ${msg}`.toLowerCase();
  const states = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
    'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
    'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Jammu and Kashmir', 'Ladakh',
  ];
  return states.find((s) => haystack.includes(s.toLowerCase()));
}

export async function fetchWeatherAlerts(location: LocationResult): Promise<AlertsResponse> {
  const checkedAt = new Date().toISOString();
  const officialAlerts: OfficialAlert[] = [];
  const nationalAlerts: OfficialAlert[] = [];
  let expiredCount = 0;
  let duplicatesRemoved = 0;
  const SACHET_FEED_URL = 'https://sachet.ndma.gov.in/cap_public_website/FetchAllAlertDetails';
  let feedStatus: AlertsResponse['official_feed_status'] = {
    status: 'unavailable',
    provider: 'India Meteorological Department (IMD) / NDMA Sachet CAP Feed',
    message: 'Official IMD / Sachet warning feed is currently unreachable or returned non-standard data.',
    checked_at: checkedAt,
    feed_url: SACHET_FEED_URL,
  };

  const toOfficialAlert = (item: Record<string, unknown>, fallbackIdx: number): OfficialAlert => {
    const headline = String(item.disaster_type ?? item.headline ?? item.event ?? 'Official Weather Alert');
    const desc = String(item.warning_message ?? item.description ?? headline);
    const area = String(item.area_description ?? item.areaDesc ?? item.state ?? 'India');
    const authority = String(item.alert_source ?? item.senderName ?? 'India Meteorological Department / NDMA');
    const validFrom = item.effective_start_time ? String(item.effective_start_time) : null;
    const validUntil = item.effective_end_time ? String(item.effective_end_time) : null;
    const sevInfo = classifySeverity(
      String(item.severity_color ?? item.severity ?? desc),
      item.severity ? String(item.severity) : undefined
    );
    const affectedState = extractStateFromText(area, authority, desc);
    return {
      id: String(item.identifier ?? item.id ?? `imd-${fallbackIdx}`),
      title: headline,
      event_type: classifyAlertEvent(`${headline} ${desc}`),
      severity: sevInfo.severity,
      severity_rank: sevInfo.rank,
      official_severity_label: sevInfo.officialLabel,
      issuing_authority: authority,
      affected_state: affectedState,
      affected_district: area,
      affected_area: area,
      issued_at: validFrom,
      valid_from: validFrom,
      valid_until: validUntil,
      status: computeAlertLifecycle(validFrom, validUntil),
      description: desc,
      precautions: [
        'Follow local IMD and State Disaster Management Authority instructions.',
        'Monitor official bulletins before planning travel or outdoor work.',
      ],
      source: 'Official NDMA Sachet / IMD CAP Feed',
      source_link: 'https://sachet.ndma.gov.in',
      is_official: true,
    };
  };

  // Attempt real official Indian CAP feed (NDMA Sachet / IMD alerts)
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const sachetRes = await fetch(SACHET_FEED_URL, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (sachetRes.ok) {
      const data = await sachetRes.json();
      const rows = Array.isArray(data)
        ? data
        : Array.isArray((data as { alerts?: unknown[] })?.alerts)
        ? (data as { alerts: unknown[] }).alerts
        : [];
      const regionTerms = [location.name, location.admin1]
        .filter(Boolean)
        .map((s) => String(s).toLowerCase());

      const seenKeys = new Set<string>();

      for (const [idx, item] of (rows as Array<Record<string, unknown>>).entries()) {
        const formatted = toOfficialAlert(item, idx + 1);
        const dedupKey = `${formatted.title.toLowerCase()}|${formatted.affected_area.toLowerCase()}|${formatted.valid_from ?? ''}`;
        if (seenKeys.has(formatted.id) || seenKeys.has(dedupKey)) {
          duplicatesRemoved++;
          continue;
        }
        seenKeys.add(formatted.id);
        seenKeys.add(dedupKey);

        if (formatted.status === 'expired') {
          expiredCount++;
        }

        const area = formatted.affected_area.toLowerCase();
        const msg = formatted.description.toLowerCase();
        const authority = formatted.issuing_authority.toLowerCase();
        const stateMatch = (formatted.affected_state || '').toLowerCase();

        const isIndia = !location.country_code || location.country_code === 'IN';
        const isLocalMatch =
          isIndia &&
          regionTerms.some(
            (term) =>
              term &&
              (area.includes(term) ||
                msg.includes(term) ||
                authority.includes(term) ||
                stateMatch === term)
          );

        if (isLocalMatch) {
          officialAlerts.push(formatted);
        } else if (nationalAlerts.length < 20) {
          nationalAlerts.push(formatted);
        }
      }

      // Severity-based prioritization (highest rank first, active before upcoming/expired)
      const sortAlerts = (list: OfficialAlert[]) =>
        list.sort((a, b) => {
          const statusWeight = (s?: AlertLifecycleStatus) =>
            s === 'active' ? 3 : s === 'upcoming' ? 2 : 1;
          const swDiff = statusWeight(b.status) - statusWeight(a.status);
          if (swDiff !== 0) return swDiff;
          return (b.severity_rank ?? 0) - (a.severity_rank ?? 0);
        });

      sortAlerts(officialAlerts);
      sortAlerts(nationalAlerts);

      feedStatus = {
        status: 'available',
        provider: 'India Meteorological Department (IMD) / NDMA Sachet CAP Feed',
        message:
          officialAlerts.length > 0
            ? `${officialAlerts.length} official bulletin(s) matched ${location.name}${location.admin1 ? `, ${location.admin1}` : ''} (${rows.length} total active across India).`
            : `Connected to live official CAP feed (${rows.length} bulletin(s) across India). None currently target ${location.name}${location.admin1 ? `, ${location.admin1}` : ''}.`,
        checked_at: checkedAt,
        feed_url: SACHET_FEED_URL,
      };
    }
  } catch (err) {
    feedStatus = {
      status: 'unavailable',
      provider: 'India Meteorological Department (IMD) / NDMA Sachet CAP Feed',
      message: `Official IMD/NDMA feed could not be retrieved (${err instanceof Error ? err.message : 'timeout'}). This does not imply no weather hazard exists.`,
      checked_at: checkedAt,
      feed_url: SACHET_FEED_URL,
    };
  } finally {
    clearTimeout(timer);
  }

  // Separate meteorological advisories derived purely from live Open-Meteo thresholds
  const advisories: MeteorologicalAdvisory[] = [];
  try {
    const wx = await fetchNormalizedWeather(location);
    const maxTemp24h = Math.max(...wx.hourly.slice(0, 24).map((h) => h.temperature_c), wx.current.temperature_c);
    const maxRainProb24h = Math.max(...wx.hourly.slice(0, 24).map((h) => h.rain_probability_percent), 0);
    const totalRain24h = wx.hourly.slice(0, 24).reduce((sum, h) => sum + h.precipitation_mm, 0);
    const maxWind24h = Math.max(...wx.hourly.slice(0, 24).map((h) => h.wind_speed_kmh), wx.current.wind_speed_kmh);
    const hasStormCode = wx.hourly.slice(0, 24).some((h) => h.weather_code >= 95);

    if (maxTemp24h >= 40) {
      advisories.push({
        id: 'adv-heat',
        title: 'Elevated Heat Stress Threshold',
        event_type: 'Heatwave Advisory (Derived)',
        severity: maxTemp24h >= 44 ? 'High' : 'Moderate',
        location_name: location.name,
        summary: `Open-Meteo forecasts peak temperatures reaching ${maxTemp24h.toFixed(1)}°C over the next 24 hours.`,
        precautions: [
          'Avoid direct sun exposure between 12:00 PM and 4:00 PM.',
          'Stay hydrated with ORS or water and wear lightweight cotton clothing.',
        ],
        source: 'Derived from Open-Meteo Forecast Thresholds (Non-Official)',
        is_official: false,
      });
    }

    if (totalRain24h >= 20 || maxRainProb24h >= 70) {
      advisories.push({
        id: 'adv-rain',
        title: 'Significant Rainfall Probability',
        event_type: 'Rainfall Advisory (Derived)',
        severity: totalRain24h >= 50 ? 'High' : 'Moderate',
        location_name: location.name,
        summary: `Open-Meteo indicates up to ${maxRainProb24h}% rain probability and ~${totalRain24h.toFixed(1)} mm accumulation in the next 24 hours.`,
        precautions: [
          'Carry waterproof gear and allow extra commute time for waterlogging.',
          'Avoid low-lying underpasses during intense downpours.',
        ],
        source: 'Derived from Open-Meteo Forecast Thresholds (Non-Official)',
        is_official: false,
      });
    }

    if (hasStormCode) {
      advisories.push({
        id: 'adv-storm',
        title: 'Convective Thunderstorm Signal',
        event_type: 'Thunderstorm Advisory (Derived)',
        severity: 'High',
        location_name: location.name,
        summary: 'Open-Meteo weather codes indicate thunderstorm activity within the next 24 hours.',
        precautions: [
          'Seek shelter indoors and avoid open fields or tall isolated trees.',
          'Unplug sensitive electrical appliances during lightning activity.',
        ],
        source: 'Derived from Open-Meteo Forecast Thresholds (Non-Official)',
        is_official: false,
      });
    }

    if (maxWind24h >= 35) {
      advisories.push({
        id: 'adv-wind',
        title: 'Strong Wind Advisory',
        event_type: 'Strong Winds (Derived)',
        severity: maxWind24h >= 55 ? 'High' : 'Moderate',
        location_name: location.name,
        summary: `Forecast wind speeds may reach ${maxWind24h.toFixed(1)} km/h over the next 24 hours.`,
        precautions: [
          'Secure loose outdoor items, balconies, and temporary structures.',
          'Exercise caution while driving high-profile vehicles on exposed bridges.',
        ],
        source: 'Derived from Open-Meteo Forecast Thresholds (Non-Official)',
        is_official: false,
      });
    }
  } catch {
    // Do not fabricate advisories if Open-Meteo itself failed
  }

  return {
    location,
    official_alerts: officialAlerts,
    national_alerts: nationalAlerts,
    expired_count: expiredCount,
    duplicates_removed: duplicatesRemoved,
    official_feed_status: feedStatus,
    advisories,
    last_updated: checkedAt,
  };
}

export async function fetchRegionalOverview(stateName: string): Promise<RegionalOverviewResponse> {
  const districts = getDistrictsForState(stateName);
  const lats = districts.map((d) => d.latitude.toFixed(4)).join(',');
  const lons = districts.map((d) => d.longitude.toFixed(4)).join(',');
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=precipitation_probability&forecast_days=1&timezone=Asia/Kolkata`;

  const [rawWeather, stateAlertsPayload] = await Promise.all([
    fetchJsonWithTimeout<
      | Array<{ current?: Record<string, number | string>; hourly?: Record<string, Array<number | string | null>> }>
      | { current?: Record<string, number | string>; hourly?: Record<string, Array<number | string | null>> }
    >(url),
    fetchWeatherAlerts({
      name: stateName,
      admin1: stateName,
      country: 'India',
      country_code: 'IN',
      latitude: districts[0].latitude,
      longitude: districts[0].longitude,
    }),
  ]);

  const list = Array.isArray(rawWeather) ? rawWeather : [rawWeather];
  const stateAlerts = stateAlertsPayload.official_alerts;

  const districtReports: RegionalDistrictReport[] = districts.map((loc, idx) => {
    const entry = list[idx] ?? {};
    const cur = entry.current ?? {};
    const wmo = Number(cur.weather_code ?? 0);
    const rainProb = entry.hourly?.precipitation_probability?.[0];
    const locTerm = loc.name.toLowerCase().split(' ')[0];
    const matchedAlerts = stateAlerts.filter((a) => {
      const text = `${a.affected_area} ${a.description} ${a.affected_state ?? ''}`.toLowerCase();
      return text.includes(locTerm) || text.includes(stateName.toLowerCase());
    });

    return {
      location: loc,
      temperature_c: Number(cur.temperature_2m ?? 0),
      feels_like_c: Number(cur.apparent_temperature ?? cur.temperature_2m ?? 0),
      humidity_percent: Number(cur.relative_humidity_2m ?? 0),
      wind_speed_kmh: Number(cur.wind_speed_10m ?? 0),
      precipitation_mm: Number(cur.precipitation ?? 0),
      rain_probability_percent: rainProb != null ? Number(rainProb) : null,
      weather_code: wmo,
      condition_label: wmoCodeToCondition(wmo),
      active_alerts: matchedAlerts,
    };
  });

  return {
    state: stateName,
    districts: districtReports,
    state_alerts: stateAlerts,
    feed_status: stateAlertsPayload.official_feed_status,
    source: 'Open-Meteo Multi-Point + Official NDMA Sachet / IMD CAP Feed',
    last_updated: new Date().toISOString(),
  };
}
