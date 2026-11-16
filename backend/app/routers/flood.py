from fastapi import APIRouter
from app.services.flood_predictor import flood_predictor

router = APIRouter(prefix="/api/flood", tags=["flood"])


@router.get("/status")
async def get_flood_module_status():
    return flood_predictor.status_summary()
