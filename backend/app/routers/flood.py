from fastapi import APIRouter, Query
from app.services.flood_predictor import flood_predictor

router = APIRouter(prefix="/api/flood", tags=["flood"])


@router.get("/status")
async def get_flood_module_status():
    return flood_predictor.status_summary()


@router.get("/districts")
async def get_supported_flood_districts():
    return {
        "module": flood_predictor.module_name,
        "region": flood_predictor.target_region,
        "districts": [
            {
                "district": name,
                "display_name": name.title(),
                **meta,
            }
            for name, meta in sorted(flood_predictor.study_districts.items())
        ],
    }


@router.get("/predict")
async def predict_flood_onset(
    district: str = Query(..., min_length=1, description="District name (e.g. Gonda, Sitapur, Prayagraj)"),
    forecast_date: str | None = Query(
        default=None,
        description="Target forecast date YYYY-MM-DD (defaults to today IST; valid June–October)",
    ),
):
    return await flood_predictor.predict_district(district, forecast_date)


@router.get("/regional")
async def predict_regional_flood_onset(
    forecast_date: str | None = Query(
        default=None,
        description="Target forecast date YYYY-MM-DD (defaults to today IST; valid June–October)",
    ),
):
    return await flood_predictor.predict_regional(forecast_date)


@router.post("/reload")
async def reload_flood_artifacts():
    flood_predictor.reload()
    return flood_predictor.status_summary()
