# WeatherGPT Standalone Python FastAPI Backend

This directory contains the complete standalone Python backend built with **FastAPI**, **LangChain**, **Groq (`ChatGroq`)**, **Open-Meteo**, **IMD / NDMA Sachet**, and **PostgreSQL**.

## Prerequisites

- Python 3.10+
- PostgreSQL 14+
- A Groq API key (`GROQ_API_KEY`)

## Setup & Run Locally

1. **Create and initialize PostgreSQL database**

   ```bash
   createdb weathergpt
   psql -d weathergpt -f schema.sql
   ```

2. **Create virtual environment & install dependencies**

   ```bash
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate   # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env
   # Edit .env and set GROQ_API_KEY and DATABASE_URL
   ```

4. **Start the FastAPI server**

   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

5. **Connect the React frontend to FastAPI**

   In the root project `.env`, set:

   ```bash
   FASTAPI_URL=http://127.0.0.1:8000
   ```

   Then run `npm run dev` from the root directory. All `/api/*` requests will be routed directly to the Python FastAPI + LangChain backend.

## Future Uttar Pradesh Flood Prediction Module

`app/services/flood_predictor.py` and `app/routers/flood.py` provide a clean modular adapter interface for loading your separately trained UP flood-prediction model and feature pipeline without modifying the core weather or AI agent architecture.
