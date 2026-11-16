# WeatherGPT — AI-Powered Weather Intelligence Platform

WeatherGPT is a full-stack meteorological intelligence platform combining **live Open-Meteo & IMD weather data**, a **Groq + LangChain tool-calling assistant** with contextual conversation memory, **PostgreSQL persistent chat history**, **Recharts forecast & historical analytics**, and an **interactive Leaflet + OpenStreetMap weather map**.

## Architecture

- **Frontend (`/src`)**: React 19, TypeScript, Tailwind CSS v4, Recharts, Leaflet + OpenStreetMap, Web Speech API (multilingual voice input & text-to-speech across 10 languages).
- **Standalone Python Backend (`/backend`)**: FastAPI, LangChain (`langchain-groq`), Async SQLAlchemy + PostgreSQL (`schema.sql`), Open-Meteo integration, modular IMD/NDMA Sachet CAP alert service, and a modular Uttar Pradesh flood-prediction adapter slot (`app/services/flood_predictor.py`).
- **Node/Express Full-Stack Preview Server (`server.ts`)**: Runs on port `3000` with Vite middleware and implements the full `/api/*` contract (including optional transparent proxying to FastAPI via `FASTAPI_URL`).

## Running Locally

### Option 1: Standalone Python FastAPI + PostgreSQL + React Frontend

1. Initialize PostgreSQL:
   ```bash
   createdb weathergpt
   psql -d weathergpt -f backend/schema.sql
   ```
2. Start Python FastAPI (`backend/README.md` for details):
   ```bash
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   cp .env.example .env   # Add GROQ_API_KEY and DATABASE_URL
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
3. Start the Frontend + Proxy (`FASTAPI_URL=http://127.0.0.1:8000` in root `.env`):
   ```bash
   npm install
   npm run dev
   ```

### Option 2: Unified Full-Stack Server (Port 3000)

```bash
cp .env.example .env   # Set GROQ_API_KEY and optional DATABASE_URL
npm install
npm run dev
```
