from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.db.database import init_db
from app.routers import alerts, analytics, chat, flood, locations, map as map_router, weather

settings = get_settings()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="WeatherGPT API",
    version="1.0.0",
    description="AI-Powered Weather Intelligence Platform backend built with FastAPI, LangChain, Groq, Open-Meteo, IMD, and PostgreSQL.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(weather.router)
app.include_router(locations.router)
app.include_router(analytics.router)
app.include_router(alerts.router)
app.include_router(map_router.router)
app.include_router(chat.router)
app.include_router(flood.router)


@app.get("/api/health")
async def health():
    groq_ok = bool(settings.groq_api_key and settings.groq_api_key != "your_groq_api_key_here")
    return {
        "status": "ok",
        "runtime": "python-fastapi-langchain",
        "groq_configured": groq_ok,
        "groq_model": settings.groq_model,
        "storage": {"mode": "postgresql", "label": "PostgreSQL Persistent Store"},
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
