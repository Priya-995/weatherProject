# WeatherGPT — AI-Powered Weather Intelligence Platform

WeatherGPT is a full-stack weather platform for India. It combines **live Open-Meteo forecasts**, **official NDMA Sachet / IMD alerts**, a **tool-calling AI assistant** (Groq) that remembers conversation context, and an **experimental machine-learning flood predictor** for 14 districts of Uttar Pradesh.

The interface adapts to who is using it (citizen, farmer, government agency or disaster manager) and to the language they choose.

> **Important:** The flood predictions and AI-generated advisories are experimental and are **not** official IMD, CWC or NDMA warnings. Always follow official government bulletins.

---

## Table of contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Tech stack](#tech-stack)
4. [Project structure](#project-structure)
5. [Getting started](#getting-started)
6. [Environment variables](#environment-variables)
7. [API reference](#api-reference)
8. [The AI assistant](#the-ai-assistant)
9. [Flood prediction model](#flood-prediction-model)
10. [Alerts: official vs. derived](#alerts-official-vs-derived)
11. [Database](#database)
12. [Testing](#testing)
13. [Known limitations](#known-limitations)

---

## Features

- **Dashboard** with current conditions and a layout tailored to the selected role.
- **AI assistant** that answers only from live tool results, keeps the active location and date across follow-up questions, and saves every conversation. Supports voice input and spoken replies.
- **Hourly and 7-day forecast**, with a choice between Open-Meteo `best_match` and GFS models.
- **Interactive map** (Google Maps) showing temperature and rainfall for 16 major Indian cities.
- **3D weather observatory** (Three.js) that animates live conditions.
- **Alerts center** with official NDMA Sachet / IMD bulletins, separately labelled derived advisories, and an "explain this alert" button that simplifies a bulletin for the user's role and language.
- **Analytics** comparing recent history and forecast, optionally for two cities side by side.
- **Flood risk** for 14 Uttar Pradesh districts: a 3-day flood-onset probability from an XGBoost model.
- **Live web verification**: a Gemini + Google Search panel that returns an answer with source links.
- **Roles:** citizen, farmer, government, disaster manager.
- **Languages:** the UI is available in English, Hindi, Gujarati and Marathi. The assistant can reply in 10 languages (English, Hindi, Gujarati, Bengali, Marathi, Tamil, Telugu, Kannada, Malayalam, Punjabi).
- Light and dark themes, °C / °F toggle.

---

## Architecture

```
Browser (React 19 + Vite)
        │  /api/*
        ▼
Node/Express server  (server.ts, port 3000; serves Vite in development)
   ├── local handlers (server/*.ts) ── Open-Meteo, NDMA Sachet, Groq, Gemini, PostgreSQL
   ├── optional proxy ──► Python FastAPI backend   (port 8000, when FASTAPI_URL is set)
   └── proxy ──► Flood ML service                  (port 8001, for /api/flood/*)
```

There are two interchangeable backends with the same API:

- **Node/Express (default):** needs only `npm install` and a Groq key.
- **Python FastAPI (optional):** the same logic built with LangChain and async SQLAlchemy. When `FASTAPI_URL` is set, Express forwards every `/api` call to it and falls back to its own handlers if the call fails.

The **flood model always runs as a separate Python service** on port 8001. If `backend/.venv` exists, the Express server starts it automatically.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, Recharts, Google Maps (`@vis.gl/react-google-maps`), Three.js, Lucide icons, Web Speech API |
| Node server | Express, `tsx`, `pg` |
| Python backend | FastAPI, LangChain (`langchain-groq`), SQLAlchemy (async) + asyncpg, httpx |
| AI | Groq (`openai/gpt-oss-20b` by default), Gemini with Google Search grounding |
| ML | XGBoost, scikit-learn (isotonic calibration), pandas, joblib |
| Data | Open-Meteo (forecast, ERA5 archive, geocoding, flood/GloFAS), NDMA Sachet CAP feed |
| Storage | PostgreSQL, with a local JSON file fallback |

---

## Project structure

```
.
├── server.ts                 Express entry point: routes, proxies, Vite middleware
├── server/
│   ├── weatherService.ts     Open-Meteo + NDMA Sachet integration, alert logic
│   ├── groqAgent.ts          Tool-calling chat agent and alert explanations
│   ├── geminiSearch.ts       Gemini + Google Search grounding
│   └── db.ts                 Chat storage (PostgreSQL or local file)
├── src/                      React frontend
│   ├── App.tsx               Shell, navigation, preferences
│   ├── components/           Views (Assistant, Forecast, Map, Alerts, Analytics, ...)
│   │   ├── dashboards/       Role-specific dashboards
│   │   └── three/            3D observatory scene
│   ├── i18n/                 Translations
│   ├── data/indiaRegions.ts  State and district coordinates
│   ├── types/weather.ts      Shared API types
│   └── utils/                Formatting helpers
├── backend/                  Python backend
│   ├── app/
│   │   ├── main.py           FastAPI app
│   │   ├── routers/          weather, locations, analytics, alerts, map, chat, flood
│   │   ├── ai/               LangChain agent and tools
│   │   ├── services/         open_meteo, imd, flood_predictor
│   │   └── db/               SQLAlchemy models and repository
│   ├── flood_service.py      Standalone flood ML service (port 8001)
│   ├── ml_artifacts/         Trained model, calibrator, thresholds, lookup tables
│   ├── scripts/              Artifact verification script
│   ├── tests/                Flood predictor tests
│   └── schema.sql            PostgreSQL schema
└── public/assets/aistudio/   The four notebooks that produced the flood model
```

---

## Getting started

### Prerequisites

- Node.js 20+ and npm
- A [Groq API key](https://console.groq.com) (required for the assistant)
- Python 3.10+ (for the flood model and the optional Python backend)
- PostgreSQL 14+ (optional; without it chats are saved to a local file)

### 1. Run the app (Node server)

```bash
cp .env.example .env      # set GROQ_API_KEY at minimum
npm install
npm run dev               # http://localhost:3000
```

Weather, forecast, alerts, analytics and the map work without any other service. The assistant needs `GROQ_API_KEY`, the map needs `VITE_GOOGLE_MAPS_API_KEY`, and the web verification panel needs `GEMINI_API_KEY`.

### 2. Enable flood predictions

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r flood_requirements.txt
uvicorn flood_service:app --host 127.0.0.1 --port 8001
```

If `backend/.venv` exists, `npm run dev` starts this service for you. Set `DISABLE_FLOOD_AUTOSTART=true` to prevent that. Without the service, flood endpoints return an explicit "unavailable" status instead of a made-up value.

### 3. (Optional) Use the Python FastAPI backend

```bash
# Create the database and tables
createdb weathergpt
psql -d weathergpt -f backend/schema.sql

# Install and run
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# create backend/.env with GROQ_API_KEY and DATABASE_URL (see below)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Then set `FASTAPI_URL=http://127.0.0.1:8000` in the root `.env` and run `npm run dev`. The Gemini web-verification endpoint (`/api/search-grounding`) exists only in the Node server.

### Production build

```bash
npm run build
NODE_ENV=production npm start
```

---

## Environment variables

### Root `.env` (Node server and frontend)

| Variable | Description | Default |
|---|---|---|
| `GROQ_API_KEY` | Groq API key. Required for the assistant and alert explanations. | none |
| `GROQ_MODEL` | Groq model name. | `openai/gpt-oss-20b` |
| `GEMINI_API_KEY` | Enables Google Search grounding. | none |
| `DATABASE_URL` | PostgreSQL connection string, e.g. `postgresql://postgres:postgres@localhost:5432/weathergpt`. If empty, chats use a local JSON file. | empty |
| `CHAT_STORE_PATH` | Path of the fallback JSON store. | `/tmp/weathergpt_store.json` |
| `FASTAPI_URL` | Python backend URL. When set, `/api/*` is proxied there. | empty |
| `FLOOD_SERVICE_URL` | Flood ML service URL. | `http://127.0.0.1:8001` |
| `DISABLE_FLOOD_AUTOSTART` | Set to `true` to stop Express starting the flood service. | unset |
| `IMD_API_BASE_URL` | IMD endpoint override. | `https://mausam.imd.gov.in` |
| `PORT` | Express port. | `3000` |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps JavaScript API key for the map view. | empty |
| `APP_URL` | Public URL of the deployment. | none |

### `backend/.env` (Python backend)

| Variable | Description | Default |
|---|---|---|
| `GROQ_API_KEY` | Groq API key. | none |
| `GROQ_MODEL` | Groq model name. | `openai/gpt-oss-20b` |
| `DATABASE_URL` | Async SQLAlchemy URL, e.g. `postgresql+asyncpg://postgres:postgres@localhost:5432/weathergpt`. | local Postgres |
| `CORS_ORIGINS` | Comma-separated allowed origins. | `http://localhost:3000,http://localhost:5173` |
| `FLOOD_ARTIFACTS_DIR` | Override the flood model directory. | `backend/ml_artifacts` |

> Never commit real API keys. `.env*` files are git-ignored, except `.env.example`.

---

## API reference

All routes are under `/api`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Service status, configured providers, storage mode |
| GET | `/locations/search?q=` | Place search (Open-Meteo geocoding) |
| GET | `/weather`, `/forecast` | Current, hourly (48 h) and daily (7 days) weather. Params: `location` or `lat`/`lon`/`name`, `model` (`best_match` or `gfs_seamless`) |
| GET | `/analytics?location=&compare=&days=` | Historical (ERA5) and forecast data, with optional comparison city |
| GET | `/alerts?location=` | Official alerts and derived advisories |
| POST | `/alerts/explain` | AI simplification of an alert for a role and language |
| GET | `/regional?state=` | District-level overview for a state |
| GET | `/map/stations` | Current conditions at map stations |
| POST | `/search-grounding` | Gemini + Google Search answer with sources (Node server only) |
| GET | `/flood/status` | Flood model status |
| GET | `/flood/districts` | Supported districts (Python service) |
| GET | `/flood/predict?district=&forecast_date=` | 3-day flood-onset probability for one district |
| GET | `/flood/regional?forecast_date=` | Predictions for all 14 districts |
| POST | `/flood/reload` | Reload model artifacts (Python service) |
| GET / POST | `/conversations` | List (by `session_id`) or create conversations |
| GET / PATCH / DELETE | `/conversations/:id` | Read, update or delete a conversation |
| POST | `/chat` | Send a message; returns the updated conversation and new messages |

Interactive docs for the Python backend are at `http://localhost:8000/docs`.

---

## The AI assistant

Each chat turn works like this:

1. The user message is saved, and the full history is loaded from storage.
2. The model is called with a system prompt containing today's date (IST), the active location and date, the user's role and the reply language.
3. If the model requests tools, they run against live data and the results are saved. This repeats for up to 4 rounds.
4. The final answer is saved and returned.

**Tools:** `get_current_weather`, `get_hourly_forecast`, `get_daily_forecast`, `get_rain_probability`, `get_wind_info`, `get_weather_alerts`, `get_historical_weather`, `compare_locations`, `get_flood_prediction`.

**Grounding rules built into the prompt:**

- Never invent temperatures, probabilities, alerts or flood values; call a tool first.
- Keep the active location and date for follow-ups ("What about the morning?", "And Delhi?").
- Clearly separate official warnings from derived advisories and from the experimental flood model.
- Cite the data source in every answer.

**Role behaviour:** citizens get plain commuting and safety advice, farmers get rainfall, wind (spraying) and irrigation focus, government users get district-level and issuing-authority detail, and disaster managers get operational readiness information.

---

## Flood prediction model

**What it predicts:** the probability that a flood *begins* in a district during the next 3 days. It runs only from **June to October** and only for these 14 districts:

- **Central (Ganga–Gomti):** Sitapur, Kanpur Dehat, Fatehpur, Kheri (Lakhimpur), Kanpur Nagar, Unnao, Etawah
- **East (Ghaghara–Rapti):** Gonda, Bara Banki, Bahraich, Ballia, Faizabad (Ayodhya), Prayagraj, Pratapgarh

**Features (11):** rainfall over 1, 3, 7, 14 and 30 days; an antecedent precipitation index; soil moisture and its 7-day change; river discharge, its 3-day change, and its ratio to the typical discharge for that district and month.

**Pipeline** (notebooks in `public/assets/aistudio/`):

| Notebook | Step |
|---|---|
| 01 | Flood-onset labels from the India Flood Inventory v2.0, matched to current UP districts, with sampling points |
| 02 | Daily rainfall and soil moisture (Open-Meteo ERA5) and river discharge (GloFAS) per district |
| 03 | Feature table, target definition, train/val/test split, and a test that no feature uses future data |
| 04 | XGBoost training, isotonic calibration, CSI-optimised threshold, and the experiments below |

**At prediction time**, `backend/app/services/flood_predictor.py` fetches recent rainfall, soil moisture and river discharge from Open-Meteo, rebuilds the same 11 features, applies the model and calibrator, and compares the result with the threshold. Results are cached for 15 minutes. Risk levels are `elevated` (above threshold), `moderate` (above the district's seasonal baseline) and `low`.

**Strict honesty rules:** the service never makes up a probability. It returns `status: "unavailable"` with a reason (`unsupported_district`, `outside_monsoon_season`, `open_meteo_fetch_failed`, `missing_input_data`, `model_artifacts_missing`, and others), and every result has `is_official: false`.

**Measured performance (test split, from notebook 04):**

| Model | PR-AUC | Brier skill vs climatology | CSI |
|---|---|---|---|
| Seasonal climatology | 0.038 | 0.000 | 0.030 |
| Rainfall rule (64.5 mm/day) | 0.029 | −0.001 | 0.029 |
| **XGBoost + calibration** | **0.056** | **+0.022** | **0.058** |

Flood onsets are rare (about 3% of test days), so skill is modest. At the chosen threshold the hit rate is about 16% and most alerts are false alarms (about 92%). A shuffled-label control gave p ≈ 0.048. The model is a research prototype and should be used as one signal among many, never as a warning system.

Check that the artifacts load correctly:

```bash
backend/.venv/bin/python backend/scripts/prepare_artifacts.py
```

---

## Alerts: official vs. derived

The alerts view and the assistant keep two kinds of information strictly apart:

- **Official alerts** come from the NDMA Sachet CAP feed. They are de-duplicated, classified by severity (Red, Orange, Yellow, Alert, Watch, Advisory), marked active, upcoming or expired, and matched to the selected city or state. If the feed cannot be reached, the app says so rather than implying there is no hazard.
- **Derived advisories** are computed from Open-Meteo forecast thresholds (heat ≥ 40 °C, heavy rain, thunderstorm codes, wind ≥ 35 km/h). They are always labelled non-official.

---

## Database

Two tables hold chat history:

- `conversations` — `id`, `session_id`, `title`, `active_location`, `active_date`, `language`, `user_type`, timestamps
- `messages` — `id`, `conversation_id` (cascade delete), `role` (`system`, `user`, `assistant`, `tool`), `content`, `tool_calls`, `tool_call_id`, `tool_name`, `tool_result`, `language`, `created_at`

The Node server creates these tables automatically when `DATABASE_URL` is set. For the Python backend, run `backend/schema.sql` (or let SQLAlchemy create them at startup). If PostgreSQL is unavailable, the Node server falls back to a local JSON file.

Conversations are grouped by a browser-generated `session_id`. There is no user login.

---

## Testing

```bash
npm run lint                    # TypeScript type check

cd backend
source .venv/bin/activate
pip install pytest httpx        # not included in requirements files
pytest tests
```

The backend tests cover feature engineering, district-name handling, calibration, and the "unavailable" responses of the flood service.

---

## Known limitations

- Flood predictions cover only 14 UP districts and only June–October, and have low absolute skill (see above).
- Official alert matching is text-based (city or state names), so some alerts may not be matched to a location.
- The map view requires a Google Maps API key.
- Conversations are not authenticated; anyone with a session ID can read its chats.
- The Python backend does not include the Gemini web-verification endpoint.

---

## Disclaimer

WeatherGPT is an informational tool. AI-generated text and ML flood probabilities are **not** official government warnings. For safety-critical decisions, rely on the India Meteorological Department (IMD), the Central Water Commission (CWC), the National Disaster Management Authority (NDMA) and your state disaster management authority.
