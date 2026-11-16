from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query
from app.services.open_meteo import fetch_map_stations, resolve_location

router = APIRouter(prefix="/api/map", tags=["map"])


@router.get("/stations")
async def get_map_stations(
    location: str | None = Query(None),
    lat: float | None = Query(None),
    lon: float | None = Query(None),
    name: str | None = Query(None),
):
    try:
        extra = None
        if lat is not None and lon is not None:
            extra = {"name": name or f"{lat:.2f}, {lon:.2f}", "country": "", "latitude": lat, "longitude": lon}
        elif location:
            extra = await resolve_location(location)

        stations = await fetch_map_stations(extra)
        return {
            "stations": stations,
            "source": "Open-Meteo Multi-Point API",
            "last_updated": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))
