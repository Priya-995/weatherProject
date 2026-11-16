from typing import Any
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from app.ai.agent import explain_alert_with_groq
from app.services.imd import fetch_weather_alerts
from app.services.open_meteo import resolve_location

router = APIRouter(prefix="/api", tags=["alerts"])


class ExplainAlertBody(BaseModel):
    alert: dict[str, Any]
    user_type: str = "citizen"
    language: str = "en"


@router.get("/alerts")
async def get_alerts(
    location: str = Query("Ahmedabad"),
    lat: float | None = Query(None),
    lon: float | None = Query(None),
    name: str | None = Query(None),
):
    try:
        loc = (
            {"name": name or f"{lat:.2f}, {lon:.2f}", "country": "India", "country_code": "IN", "latitude": lat, "longitude": lon}
            if lat is not None and lon is not None
            else await resolve_location(location)
        )
        return await fetch_weather_alerts(loc)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))


@router.post("/alerts/explain")
async def explain_alert(body: ExplainAlertBody):
    try:
        return await explain_alert_with_groq(
            alert=body.alert,
            user_type=body.user_type,
            language=body.language,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail={"error": "GROQ_API_KEY_MISSING", "message": str(exc)})
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
