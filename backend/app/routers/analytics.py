import asyncio
from fastapi import APIRouter, HTTPException, Query
from app.services.open_meteo import fetch_historical_weather, fetch_normalized_weather, resolve_location

router = APIRouter(prefix="/api", tags=["analytics"])


@router.get("/analytics")
async def get_analytics(
    location: str = Query("Ahmedabad"),
    compare: str | None = Query(None),
    days: int = Query(14, ge=7, le=60),
):
    try:
        loc_a = await resolve_location(location)
        hist_a, fc_a = await asyncio.gather(
            fetch_historical_weather(loc_a, days),
            fetch_normalized_weather(loc_a, "best_match"),
        )

        comparison = None
        if compare:
            loc_b = await resolve_location(compare)
            hist_b, fc_b = await asyncio.gather(
                fetch_historical_weather(loc_b, days),
                fetch_normalized_weather(loc_b, "best_match"),
            )
            comparison = {
                "location": fc_b["location"],
                "historical": hist_b,
                "forecast": fc_b,
            }

        return {
            "primary": {
                "location": fc_a["location"],
                "historical": hist_a,
                "forecast": fc_a,
            },
            "comparison": comparison,
        }
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))
