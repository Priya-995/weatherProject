import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import type { OfficialAlert, SupportedLanguageCode, UserRoleType } from './src/types/weather.ts';
import { chatRepo } from './server/db.ts';
import { explainAlertWithGroq, runWeatherGptTurn } from './server/groqAgent.ts';
import {
  fetchHistoricalWeather,
  fetchMapStations,
  fetchNormalizedWeather,
  fetchRegionalOverview,
  fetchWeatherAlerts,
  resolveLocation,
  searchLocations,
} from './server/weatherService.ts';

const PORT = Number(process.env.PORT || 3000);
const FASTAPI_URL = process.env.FASTAPI_URL?.trim().replace(/\/$/, '');

async function startServer() {
  await chatRepo.init();

  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Optional transparent proxy to standalone Python FastAPI backend when FASTAPI_URL is configured
  if (FASTAPI_URL) {
    app.use('/api', async (req: Request, res: Response, next: NextFunction) => {
      try {
        const targetUrl = `${FASTAPI_URL}/api${req.url}`;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        const init: RequestInit = { method: req.method, headers };
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          init.body = JSON.stringify(req.body ?? {});
        }
        const upstream = await fetch(targetUrl, init);
        const text = await upstream.text();
        res.status(upstream.status);
        res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
        res.send(text);
      } catch (err) {
        console.warn('FastAPI proxy failed, falling back to local Express handler:', err);
        next();
      }
    });
  }

  app.get('/api/health', (_req, res) => {
    const groqConfigured = Boolean(
      process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'MY_GROQ_API_KEY'
    );
    res.json({
      status: 'ok',
      runtime: FASTAPI_URL ? 'fastapi-proxy' : 'express-node',
      groq_configured: groqConfigured,
      groq_model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
      storage: chatRepo.getStorageInfo(),
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/locations/search', async (req, res) => {
    try {
      const q = String(req.query.q ?? '');
      const results = await searchLocations(q);
      res.json({ results });
    } catch (err) {
      res.status(502).json({
        error: 'LOCATION_SEARCH_FAILED',
        message: err instanceof Error ? err.message : 'Unable to query Open-Meteo geocoding.',
      });
    }
  });

  app.get('/api/weather', async (req, res) => {
    try {
      const lat = req.query.lat ? Number(req.query.lat) : null;
      const lon = req.query.lon ? Number(req.query.lon) : null;
      const city = String(req.query.location ?? 'Ahmedabad');
      const model = req.query.model === 'gfs_seamless' ? 'gfs_seamless' : 'best_match';

      const location =
        lat !== null && lon !== null && !Number.isNaN(lat) && !Number.isNaN(lon)
          ? {
              name: String(req.query.name ?? `${lat.toFixed(2)}, ${lon.toFixed(2)}`),
              admin1: req.query.admin1 ? String(req.query.admin1) : undefined,
              country: String(req.query.country ?? 'India'),
              country_code: req.query.country_code ? String(req.query.country_code) : undefined,
              latitude: lat,
              longitude: lon,
              timezone: 'auto',
            }
          : await resolveLocation(city);

      const weather = await fetchNormalizedWeather(location, model);
      res.json(weather);
    } catch (err) {
      res.status(502).json({
        error: 'WEATHER_FETCH_FAILED',
        message: err instanceof Error ? err.message : 'Unable to fetch live weather from Open-Meteo.',
      });
    }
  });

  app.get('/api/forecast', async (req, res) => {
    try {
      const city = String(req.query.location ?? 'Ahmedabad');
      const model = req.query.model === 'gfs_seamless' ? 'gfs_seamless' : 'best_match';
      const lat = req.query.lat ? Number(req.query.lat) : null;
      const lon = req.query.lon ? Number(req.query.lon) : null;

      const location =
        lat !== null && lon !== null && !Number.isNaN(lat) && !Number.isNaN(lon)
          ? {
              name: String(req.query.name ?? `${lat.toFixed(2)}, ${lon.toFixed(2)}`),
              admin1: req.query.admin1 ? String(req.query.admin1) : undefined,
              country: String(req.query.country ?? 'India'),
              latitude: lat,
              longitude: lon,
              timezone: 'auto',
            }
          : await resolveLocation(city);

      const forecast = await fetchNormalizedWeather(location, model);
      res.json(forecast);
    } catch (err) {
      res.status(502).json({
        error: 'FORECAST_FETCH_FAILED',
        message: err instanceof Error ? err.message : 'Unable to fetch forecast data.',
      });
    }
  });

  app.get('/api/analytics', async (req, res) => {
    try {
      const cityA = String(req.query.location ?? 'Ahmedabad');
      const cityB = req.query.compare ? String(req.query.compare) : null;
      const days = req.query.days ? Number(req.query.days) : 14;

      const locA = await resolveLocation(cityA);
      const [historicalA, forecastA] = await Promise.all([
        fetchHistoricalWeather(locA, days),
        fetchNormalizedWeather(locA, 'best_match'),
      ]);

      let comparison = null;
      if (cityB) {
        const locB = await resolveLocation(cityB);
        const [historicalB, forecastB] = await Promise.all([
          fetchHistoricalWeather(locB, days),
          fetchNormalizedWeather(locB, 'best_match'),
        ]);
        comparison = {
          location: forecastB.location,
          historical: historicalB,
          forecast: forecastB,
        };
      }

      res.json({
        primary: {
          location: forecastA.location,
          historical: historicalA,
          forecast: forecastA,
        },
        comparison,
      });
    } catch (err) {
      res.status(502).json({
        error: 'ANALYTICS_FETCH_FAILED',
        message: err instanceof Error ? err.message : 'Unable to load historical and forecast analytics.',
      });
    }
  });

  app.get('/api/alerts', async (req, res) => {
    try {
      const city = String(req.query.location ?? 'Ahmedabad');
      const lat = req.query.lat ? Number(req.query.lat) : null;
      const lon = req.query.lon ? Number(req.query.lon) : null;

      const location =
        lat !== null && lon !== null && !Number.isNaN(lat) && !Number.isNaN(lon)
          ? {
              name: String(req.query.name ?? `${lat.toFixed(2)}, ${lon.toFixed(2)}`),
              admin1: req.query.admin1 ? String(req.query.admin1) : undefined,
              country: String(req.query.country ?? 'India'),
              country_code: req.query.country_code ? String(req.query.country_code) : 'IN',
              latitude: lat,
              longitude: lon,
            }
          : await resolveLocation(city);

      const alerts = await fetchWeatherAlerts(location);
      res.json(alerts);
    } catch (err) {
      res.status(502).json({
        error: 'ALERTS_FETCH_FAILED',
        message: err instanceof Error ? err.message : 'Unable to fetch weather alerts.',
      });
    }
  });

  app.post('/api/alerts/explain', async (req, res) => {
    try {
      const { alert, user_type, language } = req.body ?? {};
      if (!alert || !alert.title) {
        return res.status(400).json({ error: 'INVALID_ALERT', message: 'Alert object is required.' });
      }
      const explanation = await explainAlertWithGroq({
        alert: alert as OfficialAlert,
        userType: (user_type || 'citizen') as UserRoleType,
        language: (language || 'en') as SupportedLanguageCode,
      });
      return res.json(explanation);
    } catch (err) {
      const typedErr = err as Error & { code?: string; status?: number };
      return res.status(typedErr.status || 500).json({
        error: typedErr.code || 'EXPLAIN_FAILED',
        message: typedErr.message || 'Unable to generate AI explanation.',
      });
    }
  });

  app.get('/api/regional', async (req, res) => {
    try {
      const state = String(req.query.state ?? 'Gujarat');
      const overview = await fetchRegionalOverview(state);
      res.json(overview);
    } catch (err) {
      res.status(502).json({
        error: 'REGIONAL_FETCH_FAILED',
        message: err instanceof Error ? err.message : 'Unable to load regional district overview.',
      });
    }
  });

  app.get('/api/map/stations', async (req, res) => {
    try {
      const city = req.query.location ? String(req.query.location) : null;
      const lat = req.query.lat ? Number(req.query.lat) : null;
      const lon = req.query.lon ? Number(req.query.lon) : null;

      let extraLoc;
      if (lat !== null && lon !== null && !Number.isNaN(lat) && !Number.isNaN(lon)) {
        extraLoc = {
          name: String(req.query.name ?? `${lat.toFixed(2)}, ${lon.toFixed(2)}`),
          country: String(req.query.country ?? ''),
          latitude: lat,
          longitude: lon,
        };
      } else if (city) {
        extraLoc = await resolveLocation(city);
      }

      const stations = await fetchMapStations(extraLoc);
      res.json({
        stations,
        source: 'Open-Meteo Multi-Point API',
        last_updated: new Date().toISOString(),
      });
    } catch (err) {
      res.status(502).json({
        error: 'MAP_STATIONS_FAILED',
        message: err instanceof Error ? err.message : 'Unable to load map station observations.',
      });
    }
  });

  // Modular placeholder for upcoming Uttar Pradesh flood-prediction ML model
  app.get('/api/flood/status', (_req, res) => {
    res.json({
      module: 'uttar_pradesh_flood_prediction',
      status: 'awaiting_model',
      region: 'Uttar Pradesh',
      message:
        'Modular flood prediction slot is registered and ready. Attach the trained UP flood-prediction model and inference adapter when provided.',
    });
  });

  // Persistent Conversations & Chat APIs
  app.get('/api/conversations', async (req, res) => {
    try {
      const sessionId = String(req.query.session_id || 'demo-session');
      const conversations = await chatRepo.listConversations(sessionId);
      res.json({ conversations, storage: chatRepo.getStorageInfo() });
    } catch (err) {
      res.status(500).json({
        error: 'CONVERSATIONS_LIST_FAILED',
        message: err instanceof Error ? err.message : 'Unable to list conversations.',
      });
    }
  });

  app.post('/api/conversations', async (req, res) => {
    try {
      const { session_id, title, active_location, active_date, language, user_type } = req.body ?? {};
      const created = await chatRepo.createConversation({
        sessionId: String(session_id || 'demo-session'),
        title: title ? String(title) : undefined,
        activeLocation: active_location ? String(active_location) : null,
        activeDate: active_date ? String(active_date) : null,
        language: (language || 'en') as SupportedLanguageCode,
        userType: (user_type || 'citizen') as UserRoleType,
      });
      res.status(201).json({ conversation: created });
    } catch (err) {
      res.status(500).json({
        error: 'CONVERSATION_CREATE_FAILED',
        message: err instanceof Error ? err.message : 'Unable to create conversation.',
      });
    }
  });

  app.get('/api/conversations/:id', async (req, res) => {
    try {
      const conversation = await chatRepo.getConversation(req.params.id);
      if (!conversation) {
        return res.status(404).json({ error: 'NOT_FOUND', message: 'Conversation not found.' });
      }
      const messages = await chatRepo.getMessages(conversation.id);
      return res.json({ conversation, messages });
    } catch (err) {
      return res.status(500).json({
        error: 'CONVERSATION_LOAD_FAILED',
        message: err instanceof Error ? err.message : 'Unable to load conversation.',
      });
    }
  });

  app.patch('/api/conversations/:id', async (req, res) => {
    try {
      const { title, active_location, active_date, language } = req.body ?? {};
      const updated = await chatRepo.updateConversation(req.params.id, {
        ...(title !== undefined ? { title: String(title) } : {}),
        ...(active_location !== undefined ? { active_location } : {}),
        ...(active_date !== undefined ? { active_date } : {}),
        ...(language !== undefined ? { language } : {}),
      });
      if (!updated) {
        return res.status(404).json({ error: 'NOT_FOUND', message: 'Conversation not found.' });
      }
      return res.json({ conversation: updated });
    } catch (err) {
      return res.status(500).json({
        error: 'CONVERSATION_UPDATE_FAILED',
        message: err instanceof Error ? err.message : 'Unable to update conversation.',
      });
    }
  });

  app.delete('/api/conversations/:id', async (req, res) => {
    try {
      const deleted = await chatRepo.deleteConversation(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'NOT_FOUND', message: 'Conversation not found.' });
      }
      return res.json({ deleted: true });
    } catch (err) {
      return res.status(500).json({
        error: 'CONVERSATION_DELETE_FAILED',
        message: err instanceof Error ? err.message : 'Unable to delete conversation.',
      });
    }
  });

  app.post('/api/chat', async (req, res) => {
    try {
      const { conversation_id, session_id, message, language, user_type, default_location } = req.body ?? {};
      if (!message || !String(message).trim()) {
        return res.status(400).json({ error: 'INVALID_MESSAGE', message: 'Message cannot be empty.' });
      }

      let convId = conversation_id ? String(conversation_id) : '';
      if (!convId) {
        const created = await chatRepo.createConversation({
          sessionId: String(session_id || 'demo-session'),
          activeLocation: default_location ? String(default_location) : null,
          language: (language || 'en') as SupportedLanguageCode,
          userType: (user_type || 'citizen') as UserRoleType,
        });
        convId = created.id;
      }

      const result = await runWeatherGptTurn({
        conversationId: convId,
        userMessage: String(message).trim(),
        language: (language || 'en') as SupportedLanguageCode,
        userType: (user_type || 'citizen') as UserRoleType,
        defaultLocation: default_location ? String(default_location) : undefined,
      });

      return res.json(result);
    } catch (err) {
      const typedErr = err as Error & { code?: string; status?: number };
      const status = typedErr.status || 500;
      return res.status(status).json({
        error: typedErr.code || 'CHAT_FAILED',
        message: typedErr.message || 'WeatherGPT AI turn failed.',
      });
    }
  });

  // Vite dev middleware or static dist serving
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WeatherGPT server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
