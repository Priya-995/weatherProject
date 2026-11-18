from datetime import datetime, timedelta, timezone
from typing import Any
from langchain_core.tools import tool
from app.services.flood_predictor import flood_predictor
from app.services.imd import fetch_weather_alerts
from app.services.open_meteo import (
    fetch_historical_weather,
    fetch_normalized_weather,
    resolve_location,
)


def _ist_date(offset_days: int = 0) -> str:
    ist = datetime.now(timezone.utc) + timedelta(hours=5, minutes=30, days=offset_days)
    return ist.date().isoformat()


def _normalize_date(raw_date: str | None) -> str:
    if not raw_date:
        return _ist_date(0)
    low = raw_date.strip().lower()
    if low == "today":
        return _ist_date(0)
    if low == "tomorrow":
        return _ist_date(1)
    return raw_date.strip()


def _filter_window(hours: list[dict[str, Any]], time_of_day: str | None) -> list[dict[str, Any]]:
    if not time_of_day or time_of_day == "all":
        return hours
    out = []
    for h in hours:
        hr = int(str(h["time"])[11:13])
        if time_of_day == "morning" and 6 <= hr < 12:
            out.append(h)
        elif time_of_day == "afternoon" and 12 <= hr < 17:
            out.append(h)
        elif time_of_day == "evening" and 17 <= hr < 21:
            out.append(h)
        elif time_of_day == "night" and (hr >= 21 or hr < 6):
            out.append(h)
    return out


@tool
async def get_current_weather(location: str) -> dict[str, Any]:
    """Get live current weather conditions (temperature, feels-like, humidity, wind, rain probability, sunrise/sunset) for a city."""
    loc = await resolve_location(location)
    wx = await fetch_normalized_weather(loc)
    return {
        "location": wx["location"]["name"],
        "admin1": wx["location"].get("admin1"),
        "country": wx["location"].get("country"),
        "current": wx["current"],
        "source": wx["current"]["source"],
    }


@tool
async def get_hourly_forecast(
    location: str, date: str | None = None, time_of_day: str | None = None
) -> dict[str, Any]:
    """Get hour-by-hour forecast for a location, optionally filtered by date (YYYY-MM-DD, today, tomorrow) and time_of_day (morning, afternoon, evening, night)."""
    loc = await resolve_location(location)
    wx = await fetch_normalized_weather(loc)
    target_date = _normalize_date(date)
    hours = [h for h in wx["hourly"] if str(h["time"]).startswith(target_date)] or wx["hourly"][:24]
    return {
        "location": wx["location"]["name"],
        "date": target_date,
        "time_of_day": time_of_day or "all",
        "hourly": _filter_window(hours, time_of_day),
        "source": wx["current"]["source"],
    }


@tool
async def get_daily_forecast(location: str, days: int = 7) -> dict[str, Any]:
    """Get up to 7-day daily weather forecast for a location."""
    loc = await resolve_location(location)
    wx = await fetch_normalized_weather(loc)
    safe_days = min(max(days, 1), 7)
    return {
        "location": wx["location"]["name"],
        "daily": wx["daily"][:safe_days],
        "source": wx["current"]["source"],
    }


@tool
async def get_rain_probability(
    location: str, date: str | None = None, time_of_day: str | None = None
) -> dict[str, Any]:
    """Get detailed rain probability and expected precipitation millimeters for a location on a target date and optional time_of_day."""
    loc = await resolve_location(location)
    wx = await fetch_normalized_weather(loc)
    target_date = _normalize_date(date)
    hours = [h for h in wx["hourly"] if str(h["time"]).startswith(target_date)] or wx["hourly"][:24]
    filtered = _filter_window(hours, time_of_day)
    day_summary = next((d for d in wx["daily"] if d["date"] == target_date), wx["daily"][0] if wx["daily"] else {})
    return {
        "location": wx["location"]["name"],
        "date": target_date,
        "time_of_day": time_of_day or "all",
        "daily_rain_probability_max_percent": day_summary.get("rain_probability_max_percent"),
        "daily_precipitation_sum_mm": day_summary.get("precipitation_sum_mm"),
        "window_rain_probability_max_percent": max([h["rain_probability_percent"] for h in filtered] or [0]),
        "window_precipitation_sum_mm": round(sum(h["precipitation_mm"] for h in filtered), 1),
        "hourly_breakdown": filtered,
        "source": wx["current"]["source"],
    }


@tool
async def get_wind_info(location: str, date: str | None = None) -> dict[str, Any]:
    """Get wind speed, direction, and gusts for a location and optional date."""
    loc = await resolve_location(location)
    wx = await fetch_normalized_weather(loc)
    target_date = _normalize_date(date)
    day_summary = next((d for d in wx["daily"] if d["date"] == target_date), wx["daily"][0] if wx["daily"] else {})
    return {
        "location": wx["location"]["name"],
        "date": target_date,
        "current_wind": {
            "speed_kmh": wx["current"]["wind_speed_kmh"],
            "direction_deg": wx["current"]["wind_direction_deg"],
            "direction_cardinal": wx["current"]["wind_direction_cardinal"],
            "gusts_kmh": wx["current"]["wind_gusts_kmh"],
        },
        "daily_wind_speed_max_kmh": day_summary.get("wind_speed_max_kmh"),
        "source": wx["current"]["source"],
    }


@tool
async def get_weather_alerts(location: str) -> dict[str, Any]:
    """Retrieve official IMD/NDMA weather alerts and derived meteorological advisories for a location."""
    loc = await resolve_location(location)
    return await fetch_weather_alerts(loc)


@tool
async def get_historical_weather(location: str, days: int = 14) -> dict[str, Any]:
    """Get past historical temperature and rainfall observations from Open-Meteo archive."""
    loc = await resolve_location(location)
    return await fetch_historical_weather(loc, days)


@tool
async def compare_locations(
    location_a: str, location_b: str, date: str | None = None
) -> dict[str, Any]:
    """Compare live weather and forecast conditions between two locations side-by-side."""
    loc_a = await resolve_location(location_a)
    loc_b = await resolve_location(location_b)
    wx_a = await fetch_normalized_weather(loc_a)
    wx_b = await fetch_normalized_weather(loc_b)
    target_date = _normalize_date(date)
    day_a = next((d for d in wx_a["daily"] if d["date"] == target_date), wx_a["daily"][0] if wx_a["daily"] else {})
    day_b = next((d for d in wx_b["daily"] if d["date"] == target_date), wx_b["daily"][0] if wx_b["daily"] else {})
    return {
        "date": target_date,
        "location_a": {"name": wx_a["location"]["name"], "current": wx_a["current"], "target_day": day_a},
        "location_b": {"name": wx_b["location"]["name"], "current": wx_b["current"], "target_day": day_b},
        "source": wx_a["current"]["source"],
    }


@tool
async def get_flood_prediction(district: str, forecast_date: str | None = None) -> dict[str, Any]:
    """Query the central Uttar Pradesh 3-day flood-onset ML prediction engine (XGBoost + Isotonic Calibration) for a district and optional YYYY-MM-DD date."""
    target = _normalize_date(forecast_date)
    return await flood_predictor.predict_district(district, target)


ALL_WEATHER_TOOLS = [
    get_current_weather,
    get_hourly_forecast,
    get_daily_forecast,
    get_rain_probability,
    get_wind_info,
    get_weather_alerts,
    get_historical_weather,
    compare_locations,
    get_flood_prediction,
]

TOOL_BY_NAME = {t.name: t for t in ALL_WEATHER_TOOLS}
