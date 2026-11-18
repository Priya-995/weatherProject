"""Standalone FastAPI microservice for the UP 3-day Flood Onset XGBoost model.

Runs independently of PostgreSQL so WeatherGPT (Express or FastAPI) can call it on port 8001:
    uvicorn flood_service:app --host 127.0.0.1 --port 8001
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.flood import router as flood_router
from app.services.flood_predictor import flood_predictor

app = FastAPI(
    title="WeatherGPT Uttar Pradesh Flood Prediction Service",
    version="1.0.0",
    description=(
        "Standalone FastAPI ML inference service running the exact XGBoost + Isotonic Calibration "
        "3-day flood-onset pipeline for 14 Uttar Pradesh study districts."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(flood_router)


@app.get("/health")
async def health():
    summary = flood_predictor.status_summary()
    return {
        "ok": True,
        **summary,
    }
