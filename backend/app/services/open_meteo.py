from datetime import datetime, timedelta, timezone
from typing import Any
import httpx
from app.config import get_settings

INDIA_HUB_LOCATIONS: list[dict[str, Any]] = [
    {"id": "in-ahm", "name": "Ahmedabad", "admin1": "Gujarat", "country": "India", "country_code": "IN", "latitude": 23.0225, "longitude": 72.5714, "timezone": "Asia/Kolkata"},
    {"id": "in-del", "name": "Delhi", "admin1": "Delhi", "country": "India", "country_code": "IN", "latitude": 28.6139, "longitude": 77.2090, "timezone": "Asia/Kolkata"},
    {"id": "in-mum", "name": "Mumbai", "admin1": "Maharashtra", "country": "India", "country_code": "IN", "latitude": 19.0760, "longitude": 72.8777, "timezone": "Asia/Kolkata"},
    {"id": "in-lko", "name": "Lucknow", "admin1": "Uttar Pradesh", "country": "India", "country_code": "IN", "latitude": 26.8467, "longitude": 80.9462, "timezone": "Asia/Kolkata"},
    {"id": "in-blr", "name": "Bengaluru", "admin1": "Karnataka", "country": "India", "country_code": "IN", "latitude": 12.9716, "longitude": 77.5946, "timezone": "Asia/Kolkata"},
    {"id": "in-che", "name": "Chennai", "admin1": "Tamil Nadu", "country": "India", "country_code": "IN", "latitude": 13.0827, "longitude": 80.2707, "timezone": "Asia/Kolkata"},
    {"id": "in-kol", "name": "Kolkata", "admin1": "West Bengal", "country": "India", "country_code": "IN", "latitude": 22.5726, "longitude": 88.3639, "timezone": "Asia/Kolkata"},
    {"id": "in-hyd", "name": "Hyderabad", "admin1": "Telangana", "country": "India", "country_code": "IN", "latitude": 17.3850, "longitude": 78.4867, "timezone": "Asia/Kolkata"},
    {"id": "in-jai", "name": "Jaipur", "admin1": "Rajasthan", "country": "India", "country_code": "IN", "latitude": 26.9124, "longitude": 75.7873, "timezone": "Asia/Kolkata"},
    {"id": "in-pun", "name": "Pune", "admin1": "Maharashtra", "country": "India", "country_code": "IN", "latitude": 18.5204, "longitude": 73.8567, "timezone": "Asia/Kolkata"},
    {"id": "in-pat", "name": "Patna", "admin1": "Bihar", "country": "India", "country_code": "IN", "latitude": 25.5941, "longitude": 85.1376, "timezone": "Asia/Kolkata"},
    {"id": "in-vns", "name": "Varanasi", "admin1": "Uttar Pradesh", "country": "India", "country_code": "IN", "latitude": 25.3176, "longitude": 82.9739, "timezone": "Asia/Kolkata"},
    {"id": "in-bho", "name": "Bhopal", "admin1": "Madhya Pradesh", "country": "India", "country_code": "IN", "latitude": 23.2599, "longitude": 77.4126, "timezone": "Asia/Kolkata"},
    {"id": "in-guw", "name": "Guwahati", "admin1": "Assam", "country": "India", "country_code": "IN", "latitude": 26.1445, "longitude": 91.7362, "timezone": "Asia/Kolkata"},
    {"id": "in-chd", "name": "Chandigarh", "admin1": "Chandigarh", "country": "India", "country_code": "IN", "latitude": 30.7333, "longitude": 76.7794, "timezone": "Asia/Kolkata"},
    {"id": "in-koc", "name": "Kochi", "admin1": "Kerala", "country": "India", "country_code": "IN", "latitude": 9.9312, "longitude": 76.2673, "timezone": "Asia/Kolkata"},
]

WMO_CODES: dict[int, str] = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
}


def degrees_to_cardinal(deg: float) -> str:
    dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    idx = round(((deg % 360 + 360) % 360) / 22.5) % 16
    return dirs[idx]


def wmo_to_condition(code: int) -> str:
    return WMO_CODES.get(code, "Variable conditions")


async def search_locations(query: str) -> list[dict[str, Any]]:
    trimmed = query.strip()
    if not trimmed:
        return INDIA_HUB_LOCATIONS[:8]

    settings = get_settings()
    url = "https://geocoding-api.open-meteo.com/v1/search"
    params = {"name": trimmed, "count": 8, "language": "en", "format": "json"}
    try:
        async with httpx.AsyncClient(timeout=settings.open_meteo_timeout_seconds) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            payload = resp.json()
            results = payload.get("results") or []
            if results:
                return [
                    {
                        "id": r.get("id"),
                        "name": r.get("name", ""),
                        "admin1": r.get("admin1"),
                        "country": r.get("country", ""),
                        "country_code": r.get("country_code"),
                        "latitude": float(r["latitude"]),
                        "longitude": float(r["longitude"]),
                        "timezone": r.get("timezone", "auto"),
                    }
                    for r in results
                ]
    except Exception:
        lower = trimmed.lower()
        matched = [
            loc for loc in INDIA_HUB_LOCATIONS
            if lower in loc["name"].lower() or lower in (loc.get("admin1") or "").lower()
        ]
        if matched:
            return matched
        raise

    lower = trimmed.lower()
    return [
        loc for loc in INDIA_HUB_LOCATIONS
        if lower in loc["name"].lower() or lower in (loc.get("admin1") or "").lower()
    ]


async def resolve_location(query: str) -> dict[str, Any]:
    trimmed = query.strip()
    if not trimmed:
        return INDIA_HUB_LOCATIONS[0]
    for hub in INDIA_HUB_LOCATIONS:
        if hub["name"].lower() == trimmed.lower():
            return hub
    matches = await search_locations(trimmed)
    if not matches:
        raise ValueError(f"Location '{query}' not found via Open-Meteo geocoding.")
    return matches[0]


async def fetch_normalized_weather(
    location: dict[str, Any], model: str = "best_match"
) -> dict[str, Any]:
    settings = get_settings()
    params: dict[str, Any] = {
        "latitude": location["latitude"],
        "longitude": location["longitude"],
        "current": ",".join([
            "temperature_2m", "relative_humidity_2m", "apparent_temperature", "is_day",
            "precipitation", "weather_code", "cloud_cover", "surface_pressure",
            "wind_speed_10m", "wind_direction_10m", "wind_gusts_10m",
        ]),
        "hourly": ",".join([
            "temperature_2m", "relative_humidity_2m", "apparent_temperature",
            "precipitation_probability", "precipitation", "weather_code",
            "wind_speed_10m", "wind_direction_10m", "visibility", "uv_index",
        ]),
        "daily": ",".join([
            "weather_code", "temperature_2m_max", "temperature_2m_min",
            "sunrise", "sunset", "uv_index_max", "precipitation_sum",
            "precipitation_probability_max", "wind_speed_10m_max",
        ]),
        "timezone": location.get("timezone") or "auto",
        "forecast_days": 7,
    }
    if model == "gfs_seamless":
        params["models"] = "gfs_seamless"

    async with httpx.AsyncClient(timeout=settings.open_meteo_timeout_seconds) as client:
        resp = await client.get("https://api.open-meteo.com/v1/forecast", params=params)
        resp.raise_for_status()
        raw = resp.json()

    cur = raw.get("current") or {}
    hourly_raw = raw.get("hourly") or {}
    daily_raw = raw.get("daily") or {}

    times = hourly_raw.get("time") or []
    obs_time = str(cur.get("time") or (times[0] if times else datetime.now(timezone.utc).isoformat()))
    hour_idx = next((i for i, t in enumerate(times) if t[:13] == obs_time[:13]), 0)

    hourly = []
    for i, t in enumerate(times[:48]):
        wmo = int((hourly_raw.get("weather_code") or [0])[i] or 0)
        hourly.append({
            "time": t,
            "temperature_c": float((hourly_raw.get("temperature_2m") or [0])[i] or 0),
            "feels_like_c": float((hourly_raw.get("apparent_temperature") or [0])[i] or 0),
            "humidity_percent": float((hourly_raw.get("relative_humidity_2m") or [0])[i] or 0),
            "rain_probability_percent": float((hourly_raw.get("precipitation_probability") or [0])[i] or 0),
            "precipitation_mm": float((hourly_raw.get("precipitation") or [0])[i] or 0),
            "wind_speed_kmh": float((hourly_raw.get("wind_speed_10m") or [0])[i] or 0),
            "wind_direction_deg": float((hourly_raw.get("wind_direction_10m") or [0])[i] or 0),
            "weather_code": wmo,
            "condition_label": wmo_to_condition(wmo),
        })

    daily_times = daily_raw.get("time") or []
    daily = []
    for i, d in enumerate(daily_times):
        wmo = int((daily_raw.get("weather_code") or [0])[i] or 0)
        uv_list = daily_raw.get("uv_index_max") or []
        daily.append({
            "date": d,
            "temp_max_c": float((daily_raw.get("temperature_2m_max") or [0])[i] or 0),
            "temp_min_c": float((daily_raw.get("temperature_2m_min") or [0])[i] or 0),
            "rain_probability_max_percent": float((daily_raw.get("precipitation_probability_max") or [0])[i] or 0),
            "precipitation_sum_mm": float((daily_raw.get("precipitation_sum") or [0])[i] or 0),
            "wind_speed_max_kmh": float((daily_raw.get("wind_speed_10m_max") or [0])[i] or 0),
            "uv_index_max": float(uv_list[i]) if i < len(uv_list) and uv_list[i] is not None else None,
            "sunrise": str((daily_raw.get("sunrise") or [""])[i] or ""),
            "sunset": str((daily_raw.get("sunset") or [""])[i] or ""),
            "weather_code": wmo,
            "condition_label": wmo_to_condition(wmo),
        })

    cur_wmo = int(cur.get("weather_code") or 0)
    wind_deg = float(cur.get("wind_direction_10m") or 0)
    vis_list = hourly_raw.get("visibility") or []
    uv_hourly = hourly_raw.get("uv_index") or []
    rain_prob_hourly = hourly_raw.get("precipitation_probability") or []

    source_name = "Open-Meteo GFS Seamless" if model == "gfs_seamless" else "Open-Meteo Forecast API"

    return {
        "location": {**location, "timezone": raw.get("timezone") or location.get("timezone", "Asia/Kolkata")},
        "current": {
            "temperature_c": float(cur.get("temperature_2m") or 0),
            "feels_like_c": float(cur.get("apparent_temperature") or cur.get("temperature_2m") or 0),
            "humidity_percent": float(cur.get("relative_humidity_2m") or 0),
            "wind_speed_kmh": float(cur.get("wind_speed_10m") or 0),
            "wind_direction_deg": wind_deg,
            "wind_direction_cardinal": degrees_to_cardinal(wind_deg),
            "wind_gusts_kmh": float(cur["wind_gusts_10m"]) if cur.get("wind_gusts_10m") is not None else None,
            "precipitation_mm": float(cur.get("precipitation") or 0),
            "rain_probability_percent": float(rain_prob_hourly[hour_idx]) if hour_idx < len(rain_prob_hourly) and rain_prob_hourly[hour_idx] is not None else None,
            "weather_code": cur_wmo,
            "condition_label": wmo_to_condition(cur_wmo),
            "is_day": int(cur.get("is_day") or 1) == 1,
            "pressure_hpa": float(cur["surface_pressure"]) if cur.get("surface_pressure") is not None else None,
            "cloud_cover_percent": float(cur["cloud_cover"]) if cur.get("cloud_cover") is not None else None,
            "visibility_km": round(float(vis_list[hour_idx]) / 1000.0, 1) if hour_idx < len(vis_list) and vis_list[hour_idx] is not None else None,
            "uv_index": float(uv_hourly[hour_idx]) if hour_idx < len(uv_hourly) and uv_hourly[hour_idx] is not None else None,
            "sunrise": daily[0]["sunrise"] if daily else None,
            "sunset": daily[0]["sunset"] if daily else None,
            "observed_at": obs_time,
            "source": source_name,
        },
        "hourly": hourly,
        "daily": daily,
        "model": model,
        "sources": [{"name": source_name, "status": "available", "detail": "Live model forecast"}],
        "last_updated": datetime.now(timezone.utc).isoformat(),
    }


async def fetch_historical_weather(location: dict[str, Any], days: int = 14) -> dict[str, Any]:
    settings = get_settings()
    safe_days = min(max(days, 7), 60)
    end_dt = datetime.now(timezone.utc).date() - timedelta(days=3)
    start_dt = end_dt - timedelta(days=safe_days - 1)

    params = {
        "latitude": location["latitude"],
        "longitude": location["longitude"],
        "start_date": start_dt.isoformat(),
        "end_date": end_dt.isoformat(),
        "daily": "temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,wind_speed_10m_max",
        "timezone": location.get("timezone") or "auto",
    }

    async with httpx.AsyncClient(timeout=settings.open_meteo_timeout_seconds) as client:
        resp = await client.get("https://archive-api.open-meteo.com/v1/archive", params=params)
        resp.raise_for_status()
        raw = resp.json()

    d_raw = raw.get("daily") or {}
    dates = d_raw.get("time") or []
    daily = []
    for i, d in enumerate(dates):
        daily.append({
            "date": d,
            "temp_max_c": float((d_raw.get("temperature_2m_max") or [0])[i] or 0),
            "temp_min_c": float((d_raw.get("temperature_2m_min") or [0])[i] or 0),
            "temp_mean_c": float((d_raw.get("temperature_2m_mean") or [0])[i] or 0),
            "precipitation_sum_mm": float((d_raw.get("precipitation_sum") or [0])[i] or 0),
            "wind_speed_max_kmh": float((d_raw.get("wind_speed_10m_max") or [0])[i] or 0),
        })

    return {
        "location": location,
        "start_date": start_dt.isoformat(),
        "end_date": end_dt.isoformat(),
        "daily": daily,
        "source": "Open-Meteo Historical Archive (ERA5 Reanalysis)",
        "last_updated": datetime.now(timezone.utc).isoformat(),
    }


async def fetch_map_stations(extra_location: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    settings = get_settings()
    stations = list(INDIA_HUB_LOCATIONS)
    if extra_location and not any(
        abs(s["latitude"] - extra_location["latitude"]) < 0.05
        and abs(s["longitude"] - extra_location["longitude"]) < 0.05
        for s in stations
    ):
        stations.insert(0, extra_location)

    params = {
        "latitude": ",".join(f"{s['latitude']:.4f}" for s in stations),
        "longitude": ",".join(f"{s['longitude']:.4f}" for s in stations),
        "current": "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
        "hourly": "precipitation_probability",
        "forecast_days": 1,
        "timezone": "Asia/Kolkata",
    }

    async with httpx.AsyncClient(timeout=settings.open_meteo_timeout_seconds) as client:
        resp = await client.get("https://api.open-meteo.com/v1/forecast", params=params)
        resp.raise_for_status()
        payload = resp.json()

    items = payload if isinstance(payload, list) else [payload]
    output = []
    for idx, loc in enumerate(stations):
        entry = items[idx] if idx < len(items) else {}
        cur = entry.get("current") or {}
        wmo = int(cur.get("weather_code") or 0)
        rain_probs = (entry.get("hourly") or {}).get("precipitation_probability") or []
        output.append({
            "location": loc,
            "temperature_c": float(cur.get("temperature_2m") or 0),
            "feels_like_c": float(cur.get("apparent_temperature") or cur.get("temperature_2m") or 0),
            "humidity_percent": float(cur.get("relative_humidity_2m") or 0),
            "wind_speed_kmh": float(cur.get("wind_speed_10m") or 0),
            "precipitation_mm": float(cur.get("precipitation") or 0),
            "rain_probability_percent": float(rain_probs[0]) if rain_probs and rain_probs[0] is not None else None,
            "weather_code": wmo,
            "condition_label": wmo_to_condition(wmo),
            "observed_at": str(cur.get("time") or datetime.now(timezone.utc).isoformat()),
            "source": "Open-Meteo Multi-Point API",
        })
    return output


INDIA_STATE_DISTRICTS: dict[str, list[dict[str, Any]]] = {
    "Gujarat": [
        {"id": "gj-ahm", "name": "Ahmedabad", "admin1": "Gujarat", "country": "India", "country_code": "IN", "latitude": 23.0225, "longitude": 72.5714, "timezone": "Asia/Kolkata"},
        {"id": "gj-srt", "name": "Surat", "admin1": "Gujarat", "country": "India", "country_code": "IN", "latitude": 21.1702, "longitude": 72.8311, "timezone": "Asia/Kolkata"},
        {"id": "gj-vad", "name": "Vadodara", "admin1": "Gujarat", "country": "India", "country_code": "IN", "latitude": 22.3072, "longitude": 73.1812, "timezone": "Asia/Kolkata"},
        {"id": "gj-raj", "name": "Rajkot", "admin1": "Gujarat", "country": "India", "country_code": "IN", "latitude": 22.3039, "longitude": 70.8022, "timezone": "Asia/Kolkata"},
        {"id": "gj-bvn", "name": "Bhavnagar", "admin1": "Gujarat", "country": "India", "country_code": "IN", "latitude": 21.7645, "longitude": 72.1519, "timezone": "Asia/Kolkata"},
        {"id": "gj-jmn", "name": "Jamnagar", "admin1": "Gujarat", "country": "India", "country_code": "IN", "latitude": 22.4707, "longitude": 70.0577, "timezone": "Asia/Kolkata"},
        {"id": "gj-kch", "name": "Bhuj (Kutch)", "admin1": "Gujarat", "country": "India", "country_code": "IN", "latitude": 23.2420, "longitude": 69.6669, "timezone": "Asia/Kolkata"},
    ],
    "Maharashtra": [
        {"id": "mh-mum", "name": "Mumbai", "admin1": "Maharashtra", "country": "India", "country_code": "IN", "latitude": 19.0760, "longitude": 72.8777, "timezone": "Asia/Kolkata"},
        {"id": "mh-pun", "name": "Pune", "admin1": "Maharashtra", "country": "India", "country_code": "IN", "latitude": 18.5204, "longitude": 73.8567, "timezone": "Asia/Kolkata"},
        {"id": "mh-nag", "name": "Nagpur", "admin1": "Maharashtra", "country": "India", "country_code": "IN", "latitude": 21.1458, "longitude": 79.0882, "timezone": "Asia/Kolkata"},
        {"id": "mh-nsk", "name": "Nashik", "admin1": "Maharashtra", "country": "India", "country_code": "IN", "latitude": 19.9975, "longitude": 73.7898, "timezone": "Asia/Kolkata"},
        {"id": "mh-aur", "name": "Chhatrapati Sambhajinagar", "admin1": "Maharashtra", "country": "India", "country_code": "IN", "latitude": 19.8762, "longitude": 75.3433, "timezone": "Asia/Kolkata"},
        {"id": "mh-kol", "name": "Kolhapur", "admin1": "Maharashtra", "country": "India", "country_code": "IN", "latitude": 16.7050, "longitude": 74.2433, "timezone": "Asia/Kolkata"},
    ],
    "Uttar Pradesh": [
        {"id": "up-lko", "name": "Lucknow", "admin1": "Uttar Pradesh", "country": "India", "country_code": "IN", "latitude": 26.8467, "longitude": 80.9462, "timezone": "Asia/Kolkata"},
        {"id": "up-vns", "name": "Varanasi", "admin1": "Uttar Pradesh", "country": "India", "country_code": "IN", "latitude": 25.3176, "longitude": 82.9739, "timezone": "Asia/Kolkata"},
        {"id": "up-knp", "name": "Kanpur", "admin1": "Uttar Pradesh", "country": "India", "country_code": "IN", "latitude": 26.4499, "longitude": 80.3319, "timezone": "Asia/Kolkata"},
        {"id": "up-pry", "name": "Prayagraj", "admin1": "Uttar Pradesh", "country": "India", "country_code": "IN", "latitude": 25.4358, "longitude": 81.8463, "timezone": "Asia/Kolkata"},
        {"id": "up-gkp", "name": "Gorakhpur", "admin1": "Uttar Pradesh", "country": "India", "country_code": "IN", "latitude": 26.7606, "longitude": 83.3732, "timezone": "Asia/Kolkata"},
        {"id": "up-agr", "name": "Agra", "admin1": "Uttar Pradesh", "country": "India", "country_code": "IN", "latitude": 27.1767, "longitude": 78.0081, "timezone": "Asia/Kolkata"},
    ],
    "Assam": [
        {"id": "as-guw", "name": "Guwahati", "admin1": "Assam", "country": "India", "country_code": "IN", "latitude": 26.1445, "longitude": 91.7362, "timezone": "Asia/Kolkata"},
        {"id": "as-bis", "name": "Biswanath", "admin1": "Assam", "country": "India", "country_code": "IN", "latitude": 26.7330, "longitude": 93.1500, "timezone": "Asia/Kolkata"},
        {"id": "as-dib", "name": "Dibrugarh", "admin1": "Assam", "country": "India", "country_code": "IN", "latitude": 27.4728, "longitude": 94.9120, "timezone": "Asia/Kolkata"},
        {"id": "as-sil", "name": "Silchar", "admin1": "Assam", "country": "India", "country_code": "IN", "latitude": 24.8333, "longitude": 92.7789, "timezone": "Asia/Kolkata"},
        {"id": "as-jor", "name": "Jorhat", "admin1": "Assam", "country": "India", "country_code": "IN", "latitude": 26.7509, "longitude": 94.2037, "timezone": "Asia/Kolkata"},
    ],
    "Andhra Pradesh": [
        {"id": "ap-vsp", "name": "Visakhapatnam", "admin1": "Andhra Pradesh", "country": "India", "country_code": "IN", "latitude": 17.6868, "longitude": 83.2185, "timezone": "Asia/Kolkata"},
        {"id": "ap-vij", "name": "Vijayawada", "admin1": "Andhra Pradesh", "country": "India", "country_code": "IN", "latitude": 16.5062, "longitude": 80.6480, "timezone": "Asia/Kolkata"},
        {"id": "ap-tir", "name": "Tirupati", "admin1": "Andhra Pradesh", "country": "India", "country_code": "IN", "latitude": 13.6288, "longitude": 79.4192, "timezone": "Asia/Kolkata"},
        {"id": "ap-kak", "name": "Kakinada", "admin1": "Andhra Pradesh", "country": "India", "country_code": "IN", "latitude": 16.9891, "longitude": 82.2475, "timezone": "Asia/Kolkata"},
    ],
    "Delhi": [
        {"id": "dl-nd", "name": "Delhi", "admin1": "Delhi", "country": "India", "country_code": "IN", "latitude": 28.6139, "longitude": 77.2090, "timezone": "Asia/Kolkata"},
        {"id": "dl-dwk", "name": "Dwarka", "admin1": "Delhi", "country": "India", "country_code": "IN", "latitude": 28.5921, "longitude": 77.0460, "timezone": "Asia/Kolkata"},
        {"id": "dl-roh", "name": "Rohini", "admin1": "Delhi", "country": "India", "country_code": "IN", "latitude": 28.7495, "longitude": 77.0565, "timezone": "Asia/Kolkata"},
    ],
    "Rajasthan": [
        {"id": "rj-jai", "name": "Jaipur", "admin1": "Rajasthan", "country": "India", "country_code": "IN", "latitude": 26.9124, "longitude": 75.7873, "timezone": "Asia/Kolkata"},
        {"id": "rj-jod", "name": "Jodhpur", "admin1": "Rajasthan", "country": "India", "country_code": "IN", "latitude": 26.2389, "longitude": 73.0243, "timezone": "Asia/Kolkata"},
        {"id": "rj-uda", "name": "Udaipur", "admin1": "Rajasthan", "country": "India", "country_code": "IN", "latitude": 24.5854, "longitude": 73.7125, "timezone": "Asia/Kolkata"},
        {"id": "rj-kot", "name": "Kota", "admin1": "Rajasthan", "country": "India", "country_code": "IN", "latitude": 25.2138, "longitude": 75.8648, "timezone": "Asia/Kolkata"},
    ],
    "Tamil Nadu": [
        {"id": "tn-che", "name": "Chennai", "admin1": "Tamil Nadu", "country": "India", "country_code": "IN", "latitude": 13.0827, "longitude": 80.2707, "timezone": "Asia/Kolkata"},
        {"id": "tn-cbe", "name": "Coimbatore", "admin1": "Tamil Nadu", "country": "India", "country_code": "IN", "latitude": 11.0168, "longitude": 76.9558, "timezone": "Asia/Kolkata"},
        {"id": "tn-mdu", "name": "Madurai", "admin1": "Tamil Nadu", "country": "India", "country_code": "IN", "latitude": 9.9252, "longitude": 78.1198, "timezone": "Asia/Kolkata"},
    ],
    "West Bengal": [
        {"id": "wb-kol", "name": "Kolkata", "admin1": "West Bengal", "country": "India", "country_code": "IN", "latitude": 22.5726, "longitude": 88.3639, "timezone": "Asia/Kolkata"},
        {"id": "wb-sil", "name": "Siliguri", "admin1": "West Bengal", "country": "India", "country_code": "IN", "latitude": 26.7271, "longitude": 88.3953, "timezone": "Asia/Kolkata"},
        {"id": "wb-dgp", "name": "Durgapur", "admin1": "West Bengal", "country": "India", "country_code": "IN", "latitude": 23.5204, "longitude": 87.3119, "timezone": "Asia/Kolkata"},
    ],
    "Karnataka": [
        {"id": "ka-blr", "name": "Bengaluru", "admin1": "Karnataka", "country": "India", "country_code": "IN", "latitude": 12.9716, "longitude": 77.5946, "timezone": "Asia/Kolkata"},
        {"id": "ka-mys", "name": "Mysuru", "admin1": "Karnataka", "country": "India", "country_code": "IN", "latitude": 12.2958, "longitude": 76.6394, "timezone": "Asia/Kolkata"},
        {"id": "ka-mng", "name": "Mangaluru", "admin1": "Karnataka", "country": "India", "country_code": "IN", "latitude": 12.9141, "longitude": 74.8560, "timezone": "Asia/Kolkata"},
    ],
    "Kerala": [
        {"id": "kl-koc", "name": "Kochi", "admin1": "Kerala", "country": "India", "country_code": "IN", "latitude": 9.9312, "longitude": 76.2673, "timezone": "Asia/Kolkata"},
        {"id": "kl-trv", "name": "Thiruvananthapuram", "admin1": "Kerala", "country": "India", "country_code": "IN", "latitude": 8.5241, "longitude": 76.9366, "timezone": "Asia/Kolkata"},
        {"id": "kl-koz", "name": "Kozhikode", "admin1": "Kerala", "country": "India", "country_code": "IN", "latitude": 11.2588, "longitude": 75.7804, "timezone": "Asia/Kolkata"},
    ],
}


def get_districts_for_state(state_name: str) -> tuple[str, list[dict[str, Any]]]:
    for st, districts in INDIA_STATE_DISTRICTS.items():
        if st.lower() == state_name.strip().lower():
            return st, districts
    return "Gujarat", INDIA_STATE_DISTRICTS["Gujarat"]


async def fetch_regional_overview(state_name: str) -> dict[str, Any]:
    from app.services.imd import fetch_weather_alerts

    settings = get_settings()
    resolved_state, districts = get_districts_for_state(state_name)
    params = {
        "latitude": ",".join(f"{d['latitude']:.4f}" for d in districts),
        "longitude": ",".join(f"{d['longitude']:.4f}" for d in districts),
        "current": "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
        "hourly": "precipitation_probability",
        "forecast_days": 1,
        "timezone": "Asia/Kolkata",
    }
    async with httpx.AsyncClient(timeout=settings.open_meteo_timeout_seconds) as client:
        resp = await client.get("https://api.open-meteo.com/v1/forecast", params=params)
        resp.raise_for_status()
        payload = resp.json()

    alerts_payload = await fetch_weather_alerts({
        "name": resolved_state,
        "admin1": resolved_state,
        "country": "India",
        "country_code": "IN",
        "latitude": districts[0]["latitude"],
        "longitude": districts[0]["longitude"],
    })
    state_alerts = alerts_payload["official_alerts"]
    items = payload if isinstance(payload, list) else [payload]

    district_reports = []
    for idx, loc in enumerate(districts):
        entry = items[idx] if idx < len(items) else {}
        cur = entry.get("current") or {}
        wmo = int(cur.get("weather_code") or 0)
        rain_probs = (entry.get("hourly") or {}).get("precipitation_probability") or []
        loc_term = loc["name"].lower().split(" ")[0]
        matched = [
            a for a in state_alerts
            if loc_term in f"{a.get('affected_area', '')} {a.get('description', '')} {a.get('affected_state', '')}".lower()
            or resolved_state.lower() in f"{a.get('affected_area', '')} {a.get('description', '')} {a.get('affected_state', '')}".lower()
        ]
        district_reports.append({
            "location": loc,
            "temperature_c": float(cur.get("temperature_2m") or 0),
            "feels_like_c": float(cur.get("apparent_temperature") or cur.get("temperature_2m") or 0),
            "humidity_percent": float(cur.get("relative_humidity_2m") or 0),
            "wind_speed_kmh": float(cur.get("wind_speed_10m") or 0),
            "precipitation_mm": float(cur.get("precipitation") or 0),
            "rain_probability_percent": float(rain_probs[0]) if rain_probs and rain_probs[0] is not None else None,
            "weather_code": wmo,
            "condition_label": wmo_to_condition(wmo),
            "active_alerts": matched,
        })

    return {
        "state": resolved_state,
        "districts": district_reports,
        "state_alerts": state_alerts,
        "feed_status": alerts_payload["official_feed_status"],
        "source": "Open-Meteo Multi-Point + Official NDMA Sachet / IMD CAP Feed",
        "last_updated": datetime.now(timezone.utc).isoformat(),
    }
