from fastapi import APIRouter, HTTPException, Query
from app.services.open_meteo import fetch_normalized_weather, fetch_regional_overview, resolve_location

router = APIRouter(prefix="/api", tags=["weather"])


async def _resolve_target(location: str, lat: float | None, lon: float | None, name: str | None) -> dict:
    if lat is not None and lon is not None:
        return {
            "name": name or f"{lat:.2f}, {lon:.2f}",
            "country": "India",
            "latitude": lat,
            "longitude": lon,
            "timezone": "auto",
        }
    return await resolve_location(location)


@router.get("/weather")
async def get_weather(
    location: str = Query("Ahmedabad"),
    lat: float | None = Query(None),
    lon: float | None = Query(None),
    name: str | None = Query(None),
    model: str = Query("best_match"),
):
    try:
        loc = await _resolve_target(location, lat, lon, name)
        return await fetch_normalized_weather(loc, "gfs_seamless" if model == "gfs_seamless" else "best_match")
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))


@router.get("/forecast")
async def get_forecast(
    location: str = Query("Ahmedabad"),
    lat: float | None = Query(None),
    lon: float | None = Query(None),
    name: str | None = Query(None),
    model: str = Query("best_match"),
):
    try:
        loc = await _resolve_target(location, lat, lon, name)
        return await fetch_normalized_weather(loc, "gfs_seamless" if model == "gfs_seamless" else "best_match")
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))


@router.get("/regional")
async def get_regional(state: str = Query("Gujarat")):
    try:
        return await fetch_regional_overview(state)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))
