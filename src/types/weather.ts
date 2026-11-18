export type SupportedLanguageCode =
  | 'en'
  | 'hi'
  | 'gu'
  | 'mr'
  | 'bn'
  | 'ta'
  | 'te'
  | 'kn'
  | 'ml'
  | 'pa';

export type UILanguageCode = 'en' | 'hi' | 'gu' | 'mr';

export type UserRoleType = 'citizen' | 'farmer' | 'government' | 'disaster';

export interface LanguageOption {
  code: SupportedLanguageCode;
  name: string;
  nativeName: string;
  speechLocale: string;
  uiSupported?: boolean;
}

export const UI_LANGUAGES: Array<{
  code: UILanguageCode;
  name: string;
  nativeName: string;
  speechLocale: string;
  scriptSample: string;
}> = [
  { code: 'en', name: 'English', nativeName: 'English', speechLocale: 'en-IN', scriptSample: 'Simple & clear English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', speechLocale: 'hi-IN', scriptSample: 'सरल और स्पष्ट हिन्दी' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', speechLocale: 'gu-IN', scriptSample: 'સરળ અને સ્પષ્ટ ગુજરાતી' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', speechLocale: 'mr-IN', scriptSample: 'सोपी आणि स्पष्ट मराठी' },
];

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', speechLocale: 'en-IN', uiSupported: true },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', speechLocale: 'hi-IN', uiSupported: true },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', speechLocale: 'gu-IN', uiSupported: true },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', speechLocale: 'mr-IN', uiSupported: true },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', speechLocale: 'bn-IN' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', speechLocale: 'ta-IN' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', speechLocale: 'te-IN' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', speechLocale: 'kn-IN' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', speechLocale: 'ml-IN' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', speechLocale: 'pa-IN' },
];

export interface LocationResult {
  id?: number | string;
  name: string;
  admin1?: string;
  country: string;
  country_code?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export interface CurrentWeather {
  temperature_c: number;
  feels_like_c: number;
  humidity_percent: number;
  wind_speed_kmh: number;
  wind_direction_deg: number;
  wind_direction_cardinal: string;
  wind_gusts_kmh: number | null;
  precipitation_mm: number;
  rain_probability_percent: number | null;
  weather_code: number;
  condition_label: string;
  is_day: boolean;
  pressure_hpa: number | null;
  cloud_cover_percent: number | null;
  visibility_km: number | null;
  uv_index: number | null;
  sunrise: string | null;
  sunset: string | null;
  observed_at: string;
  source: string;
}

export interface HourlyPoint {
  time: string;
  temperature_c: number;
  feels_like_c: number;
  humidity_percent: number;
  rain_probability_percent: number;
  precipitation_mm: number;
  wind_speed_kmh: number;
  wind_direction_deg: number;
  weather_code: number;
  condition_label: string;
}

export interface DailyPoint {
  date: string;
  temp_max_c: number;
  temp_min_c: number;
  rain_probability_max_percent: number;
  precipitation_sum_mm: number;
  wind_speed_max_kmh: number;
  uv_index_max: number | null;
  sunrise: string;
  sunset: string;
  weather_code: number;
  condition_label: string;
}

export interface DataSourceInfo {
  name: string;
  status: 'available' | 'unavailable';
  detail?: string;
}

export interface NormalizedWeatherResponse {
  location: LocationResult;
  current: CurrentWeather;
  hourly: HourlyPoint[];
  daily: DailyPoint[];
  model: string;
  sources: DataSourceInfo[];
  last_updated: string;
}

export interface HistoricalDailyPoint {
  date: string;
  temp_max_c: number;
  temp_min_c: number;
  temp_mean_c: number;
  precipitation_sum_mm: number;
  wind_speed_max_kmh: number;
}

export interface HistoricalWeatherResponse {
  location: LocationResult;
  start_date: string;
  end_date: string;
  daily: HistoricalDailyPoint[];
  source: string;
  last_updated: string;
}

export type AlertLifecycleStatus = 'active' | 'upcoming' | 'expired';

export interface OfficialAlert {
  id: string;
  title: string;
  event_type: 'Heavy Rainfall' | 'Cyclone' | 'Heatwave' | 'Thunderstorm' | 'Strong Winds' | 'Weather Warning';
  severity: 'Red' | 'Orange' | 'Yellow' | 'Alert' | 'Watch' | 'Advisory';
  severity_rank?: number;
  official_severity_label?: string;
  issuing_authority: string;
  affected_state?: string;
  affected_district?: string;
  affected_area: string;
  issued_at?: string | null;
  valid_from: string | null;
  valid_until: string | null;
  status?: AlertLifecycleStatus;
  description: string;
  precautions: string[];
  source: string;
  source_link?: string;
  is_official: true;
}

export interface MeteorologicalAdvisory {
  id: string;
  title: string;
  event_type: string;
  severity: 'High' | 'Moderate' | 'Low';
  location_name: string;
  summary: string;
  precautions: string[];
  source: string;
  is_official: false;
}

export interface AlertsResponse {
  location: LocationResult;
  official_alerts: OfficialAlert[];
  national_alerts?: OfficialAlert[];
  expired_count?: number;
  duplicates_removed?: number;
  official_feed_status: {
    status: 'available' | 'unavailable';
    provider: string;
    message: string;
    checked_at: string;
    feed_url?: string;
  };
  advisories: MeteorologicalAdvisory[];
  last_updated: string;
}

export interface RegionalDistrictReport {
  location: LocationResult;
  temperature_c: number;
  feels_like_c: number;
  humidity_percent: number;
  wind_speed_kmh: number;
  precipitation_mm: number;
  rain_probability_percent: number | null;
  weather_code: number;
  condition_label: string;
  active_alerts: OfficialAlert[];
}

export interface RegionalOverviewResponse {
  state: string;
  districts: RegionalDistrictReport[];
  state_alerts: OfficialAlert[];
  feed_status: AlertsResponse['official_feed_status'];
  source: string;
  last_updated: string;
}

export interface MapStationPoint {
  location: LocationResult;
  temperature_c: number;
  feels_like_c: number;
  humidity_percent: number;
  wind_speed_kmh: number;
  precipitation_mm: number;
  rain_probability_percent: number | null;
  weather_code: number;
  condition_label: string;
  observed_at: string;
  source: string;
}

export interface ToolCallRecord {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ChatMessageRecord {
  id: string;
  conversation_id: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: ToolCallRecord[] | null;
  tool_call_id?: string | null;
  tool_name?: string | null;
  tool_result?: unknown;
  language?: SupportedLanguageCode;
  created_at: string;
}

export interface ConversationRecord {
  id: string;
  session_id: string;
  title: string;
  active_location: string | null;
  active_date: string | null;
  language: SupportedLanguageCode;
  user_type?: UserRoleType;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

export interface SearchGroundingSource {
  title: string;
  uri: string;
}

export interface SearchGroundingResponse {
  query: string;
  answer: string;
  sources: SearchGroundingSource[];
  web_search_queries: string[];
  model: string;
  checked_at: string;
}

export type FloodPredictionStatus = 'available' | 'unavailable';

export type FloodRiskLevel = 'elevated' | 'moderate' | 'low' | 'unavailable';

export interface FloodFeatureSnapshot {
  rain_1d: number;
  rain_3d: number;
  rain_7d: number;
  rain_14d: number;
  rain_30d: number;
  rain_api: number;
  soil_moisture: number;
  soil_change_7d: number;
  discharge: number;
  discharge_change_3d: number;
  discharge_anomaly: number;
}

export interface FloodPredictionResponse {
  module: 'uttar_pradesh_flood_prediction';
  status: FloodPredictionStatus;
  reason?: string;
  message: string;
  is_official: false;
  district_input: string;
  canonical_district: string | null;
  display_district: string | null;
  study_group?: 'east' | 'central' | null;
  forecast_date: string;
  horizon_days: 3;
  probability: number | null;
  raw_probability?: number | null;
  climatology_probability?: number | null;
  threshold: number | null;
  threshold_exceeded: boolean | null;
  risk_level: FloodRiskLevel;
  features?: FloodFeatureSnapshot | null;
  coordinates?: {
    district_lat: number;
    district_lon: number;
    river_lat: number;
    river_lon: number;
  } | null;
  model_info: {
    algorithm: string;
    calibration: string;
    season_months: string;
    horizon_days: number;
    trained_districts_count: number;
    model_loaded: boolean;
  };
  supported_districts: string[];
  disclaimer: string;
  generated_at: string;
}

export interface FloodRegionalResponse {
  module: 'uttar_pradesh_flood_prediction';
  forecast_date: string;
  model_loaded: boolean;
  is_official: false;
  disclaimer: string;
  districts: FloodPredictionResponse[];
  generated_at: string;
}

export type NavSection =
  | 'dashboard'
  | 'assistant'
  | 'forecast'
  | 'map'
  | 'scene3d'
  | 'alerts'
  | 'analytics'
  | 'settings';
