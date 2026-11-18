import {
  SUPPORTED_LANGUAGES,
  type ChatMessageRecord,
  type ConversationRecord,
  type OfficialAlert,
  type SupportedLanguageCode,
  type ToolCallRecord,
  type UserRoleType,
} from '../src/types/weather.ts';
import { chatRepo } from './db.ts';
import {
  fetchHistoricalWeather,
  fetchNormalizedWeather,
  fetchWeatherAlerts,
  resolveLocation,
} from './weatherService.ts';

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

interface GroqToolDef {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

const WEATHER_TOOLS: GroqToolDef[] = [
  {
    type: 'function',
    function: {
      name: 'get_current_weather',
      description: 'Get live current weather conditions (temperature, feels-like, humidity, wind, rain probability, sunrise/sunset) for a city or location.',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'City or location name, e.g. Ahmedabad, Delhi, Mumbai.' },
        },
        required: ['location'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_hourly_forecast',
      description: 'Get hour-by-hour forecast for a location, optionally filtered to a specific date (YYYY-MM-DD, today, or tomorrow) and time of day (morning, afternoon, evening, night).',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'City or location name.' },
          date: { type: 'string', description: 'Optional target date: YYYY-MM-DD, today, or tomorrow.' },
          time_of_day: {
            type: 'string',
            enum: ['morning', 'afternoon', 'evening', 'night', 'all'],
            description: 'Optional time window filter.',
          },
        },
        required: ['location'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_daily_forecast',
      description: 'Get 7-day daily weather forecast (high/low temperature, rain probability, total precipitation, max wind, sunrise/sunset).',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'City or location name.' },
          days: { type: 'integer', description: 'Number of days (1 to 7). Defaults to 7.' },
        },
        required: ['location'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_rain_probability',
      description: 'Get detailed rain probability and expected precipitation millimeters for a location on a given date and optional time of day.',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'City or location name.' },
          date: { type: 'string', description: 'Target date: YYYY-MM-DD, today, or tomorrow.' },
          time_of_day: { type: 'string', description: 'Optional: morning, afternoon, evening, night.' },
        },
        required: ['location'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_wind_info',
      description: 'Get wind speed, direction (degrees & cardinal), and wind gusts for a location and optional date.',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'City or location name.' },
          date: { type: 'string', description: 'Optional date: YYYY-MM-DD, today, or tomorrow.' },
        },
        required: ['location'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_weather_alerts',
      description: 'Retrieve official IMD/NDMA weather alerts and derived meteorological advisories for a location.',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'City or location name.' },
        },
        required: ['location'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_historical_weather',
      description: 'Get past historical weather observations (temperature max/min/mean and rainfall) from Open-Meteo archive.',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'City or location name.' },
          days: { type: 'integer', description: 'Number of historical days to fetch (7 to 30).' },
        },
        required: ['location'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'compare_locations',
      description: 'Compare weather conditions and forecast between two locations side-by-side.',
      parameters: {
        type: 'object',
        properties: {
          location_a: { type: 'string', description: 'First city or location.' },
          location_b: { type: 'string', description: 'Second city or location.' },
          date: { type: 'string', description: 'Optional target date: YYYY-MM-DD, today, or tomorrow.' },
        },
        required: ['location_a', 'location_b'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_flood_prediction',
      description:
        'Query the central Uttar Pradesh 3-day flood-onset ML prediction engine (XGBoost + Isotonic Calibration) for a district and optional date (YYYY-MM-DD). Returns calibrated probability if supported and monsoon-active (June–October), or explicit unavailable status for unsupported districts/dates/missing artifacts.',
      parameters: {
        type: 'object',
        properties: {
          district: {
            type: 'string',
            description: 'District name, e.g. Gonda, Sitapur, Prayagraj, Kanpur Nagar, Bahraich.',
          },
          forecast_date: {
            type: 'string',
            description: 'Optional target date YYYY-MM-DD, today, or tomorrow.',
          },
        },
        required: ['district'],
      },
    },
  },
];

function getIstDateString(offsetDays = 0): string {
  const now = new Date();
  const istMs = now.getTime() + 5.5 * 60 * 60 * 1000 + offsetDays * 86400 * 1000;
  return new Date(istMs).toISOString().slice(0, 10);
}

function normalizeDateToken(rawDate?: string | null): string {
  if (!rawDate) return getIstDateString(0);
  const lower = rawDate.trim().toLowerCase();
  if (lower === 'today') return getIstDateString(0);
  if (lower === 'tomorrow') return getIstDateString(1);
  if (/^\d{4}-\d{2}-\d{2}$/.test(lower)) return lower;
  return getIstDateString(0);
}

function filterHoursByWindow<T extends { time: string }>(hours: T[], timeOfDay?: string): T[] {
  if (!timeOfDay || timeOfDay === 'all') return hours;
  return hours.filter((h) => {
    const hour = Number(h.time.slice(11, 13));
    if (timeOfDay === 'morning') return hour >= 6 && hour < 12;
    if (timeOfDay === 'afternoon') return hour >= 12 && hour < 17;
    if (timeOfDay === 'evening') return hour >= 17 && hour < 21;
    if (timeOfDay === 'night') return hour >= 21 || hour < 6;
    return true;
  });
}

async function executeWeatherTool(
  name: string,
  args: Record<string, unknown>,
  fallbackLocation: string | null,
  fallbackDate: string | null
): Promise<{
  result: unknown;
  resolvedLocation?: string;
  resolvedDate?: string;
}> {
  const locArg = typeof args.location === 'string' && args.location.trim()
    ? args.location.trim()
    : fallbackLocation || 'Ahmedabad';
  const rawDateArg = typeof args.date === 'string' && args.date.trim()
    ? args.date.trim()
    : fallbackDate || 'today';
  const targetDate = normalizeDateToken(rawDateArg);

  switch (name) {
    case 'get_current_weather': {
      const loc = await resolveLocation(locArg);
      const wx = await fetchNormalizedWeather(loc);
      return {
        result: {
          location: `${wx.location.name}, ${wx.location.admin1 ? `${wx.location.admin1}, ` : ''}${wx.location.country}`,
          current: wx.current,
          source: wx.current.source,
        },
        resolvedLocation: wx.location.name,
        resolvedDate: getIstDateString(0),
      };
    }

    case 'get_hourly_forecast': {
      const loc = await resolveLocation(locArg);
      const wx = await fetchNormalizedWeather(loc);
      let hours = wx.hourly.filter((h) => h.time.startsWith(targetDate));
      if (hours.length === 0) hours = wx.hourly.slice(0, 24);
      const timeOfDay = typeof args.time_of_day === 'string' ? args.time_of_day : undefined;
      const filtered = filterHoursByWindow(hours, timeOfDay);
      return {
        result: {
          location: wx.location.name,
          date: targetDate,
          time_of_day: timeOfDay || 'all',
          hourly: filtered,
          source: wx.current.source,
        },
        resolvedLocation: wx.location.name,
        resolvedDate: targetDate,
      };
    }

    case 'get_daily_forecast': {
      const loc = await resolveLocation(locArg);
      const wx = await fetchNormalizedWeather(loc);
      const days = typeof args.days === 'number' ? Math.min(Math.max(args.days, 1), 7) : 7;
      return {
        result: {
          location: wx.location.name,
          daily: wx.daily.slice(0, days),
          source: wx.current.source,
        },
        resolvedLocation: wx.location.name,
      };
    }

    case 'get_rain_probability': {
      const loc = await resolveLocation(locArg);
      const wx = await fetchNormalizedWeather(loc);
      let hours = wx.hourly.filter((h) => h.time.startsWith(targetDate));
      if (hours.length === 0) hours = wx.hourly.slice(0, 24);
      const timeOfDay = typeof args.time_of_day === 'string' ? args.time_of_day : undefined;
      const filtered = filterHoursByWindow(hours, timeOfDay);
      const daySummary = wx.daily.find((d) => d.date === targetDate) ?? wx.daily[0];
      const maxProb = Math.max(...filtered.map((h) => Number(h.rain_probability_percent ?? 0)), 0);
      const sumMm = filtered.reduce((acc, h) => acc + Number(h.precipitation_mm ?? 0), 0);
      return {
        result: {
          location: wx.location.name,
          date: targetDate,
          time_of_day: timeOfDay || 'all',
          daily_rain_probability_max_percent: daySummary?.rain_probability_max_percent ?? maxProb,
          daily_precipitation_sum_mm: daySummary?.precipitation_sum_mm ?? sumMm,
          window_rain_probability_max_percent: maxProb,
          window_precipitation_sum_mm: Math.round(sumMm * 10) / 10,
          hourly_breakdown: filtered.map((h) => ({
            time: h.time,
            rain_probability_percent: h.rain_probability_percent,
            precipitation_mm: h.precipitation_mm,
            condition_label: h.condition_label,
          })),
          source: wx.current.source,
        },
        resolvedLocation: wx.location.name,
        resolvedDate: targetDate,
      };
    }

    case 'get_wind_info': {
      const loc = await resolveLocation(locArg);
      const wx = await fetchNormalizedWeather(loc);
      const daySummary = wx.daily.find((d) => d.date === targetDate) ?? wx.daily[0];
      const hours = wx.hourly.filter((h) => h.time.startsWith(targetDate));
      return {
        result: {
          location: wx.location.name,
          date: targetDate,
          current_wind: {
            speed_kmh: wx.current.wind_speed_kmh,
            direction_deg: wx.current.wind_direction_deg,
            direction_cardinal: wx.current.wind_direction_cardinal,
            gusts_kmh: wx.current.wind_gusts_kmh,
          },
          daily_wind_speed_max_kmh: daySummary?.wind_speed_max_kmh ?? null,
          hourly_wind_sample: hours.filter((_, idx) => idx % 3 === 0).map((h) => ({
            time: h.time,
            wind_speed_kmh: h.wind_speed_kmh,
            wind_direction_deg: h.wind_direction_deg,
          })),
          source: wx.current.source,
        },
        resolvedLocation: wx.location.name,
        resolvedDate: targetDate,
      };
    }

    case 'get_weather_alerts': {
      const loc = await resolveLocation(locArg);
      const alerts = await fetchWeatherAlerts(loc);
      return {
        result: alerts,
        resolvedLocation: alerts.location.name,
      };
    }

    case 'get_historical_weather': {
      const loc = await resolveLocation(locArg);
      const days = typeof args.days === 'number' ? args.days : 14;
      const hist = await fetchHistoricalWeather(loc, days);
      return {
        result: hist,
        resolvedLocation: hist.location.name,
      };
    }

    case 'compare_locations': {
      const locAName = typeof args.location_a === 'string' ? args.location_a : locArg;
      const locBName = typeof args.location_b === 'string' ? args.location_b : 'Mumbai';
      const [locA, locB] = await Promise.all([resolveLocation(locAName), resolveLocation(locBName)]);
      const [wxA, wxB] = await Promise.all([fetchNormalizedWeather(locA), fetchNormalizedWeather(locB)]);
      const dayA = wxA.daily.find((d) => d.date === targetDate) ?? wxA.daily[0];
      const dayB = wxB.daily.find((d) => d.date === targetDate) ?? wxB.daily[0];
      return {
        result: {
          date: targetDate,
          location_a: {
            name: wxA.location.name,
            current: wxA.current,
            target_day: dayA,
          },
          location_b: {
            name: wxB.location.name,
            current: wxB.current,
            target_day: dayB,
          },
          source: wxA.current.source,
        },
        resolvedLocation: wxA.location.name,
        resolvedDate: targetDate,
      };
    }

    case 'get_flood_prediction': {
      const districtArg =
        typeof args.district === 'string' && args.district.trim()
          ? args.district.trim()
          : locArg;
      const dateArg = normalizeDateToken(
        typeof args.forecast_date === 'string' && args.forecast_date.trim()
          ? args.forecast_date.trim()
          : fallbackDate || 'today'
      );
      const floodBase = (
        process.env.FLOOD_SERVICE_URL?.trim() || 'http://127.0.0.1:8001'
      ).replace(/\/$/, '');
      const url = `${floodBase}/api/flood/predict?district=${encodeURIComponent(districtArg)}&forecast_date=${encodeURIComponent(dateArg)}`;
      try {
        const res = await fetch(url);
        const json = await res.json();
        return {
          result: json,
          resolvedLocation: (json as { display_district?: string }).display_district || districtArg,
          resolvedDate: dateArg,
        };
      } catch (err) {
        return {
          result: {
            status: 'unavailable',
            reason: 'ml_service_offline',
            is_official: false,
            district_input: districtArg,
            forecast_date: dateArg,
            message: `Flood ML service unavailable (${err instanceof Error ? err.message : 'connection error'}).`,
          },
          resolvedLocation: districtArg,
          resolvedDate: dateArg,
        };
      }
    }

    default:
      throw new Error(`Unknown weather tool: ${name}`);
  }
}

function getRoleGuidance(userType: UserRoleType): string {
  switch (userType) {
    case 'farmer':
      return [
        `USER ROLE: Farmer.`,
        `- Speak in simple, practical everyday language without technical meteorological jargon.`,
        `- Focus on rainfall timing, temperature, humidity, wind speed (for spraying), irrigation planning (e.g., checking soil moisture before watering if rain is expected), and field/harvest protection.`,
        `- Do NOT invent crop-specific agronomic prescriptions without sufficient weather and official Agromet data.`,
      ].join('\n');
    case 'government':
      return [
        `USER ROLE: Government Agency.`,
        `- Focus on regional/district monitoring, official IMD/NDMA warning severity, validity periods, affected districts/areas, and rainfall/temperature trends.`,
        `- Clearly cite official issuing authorities and distinguish official warnings from AI-generated summaries.`,
      ].join('\n');
    case 'disaster':
      return [
        `USER ROLE: Disaster Manager.`,
        `- Focus on operational readiness: active severe weather events, affected districts, warning timelines, heavy rain/cyclone/thunderstorm risk, and preparedness checklists.`,
        `- Never present AI-generated recommendations as official government directives.`,
      ].join('\n');
    case 'citizen':
    default:
      return [
        `USER ROLE: Everyday Citizen.`,
        `- Use friendly, simple everyday language without technical weather jargon.`,
        `- Focus on daily planning: commuting, umbrella/clothing advice, outdoor activities, and practical safety precautions.`,
      ].join('\n');
  }
}

function buildSystemPrompt(
  language: SupportedLanguageCode,
  activeLocation: string | null,
  activeDate: string | null,
  userType: UserRoleType = 'citizen'
): string {
  const langMeta = SUPPORTED_LANGUAGES.find((l) => l.code === language) ?? SUPPORTED_LANGUAGES[0];
  const today = getIstDateString(0);
  const tomorrow = getIstDateString(1);

  return [
    `You are WeatherGPT, an accurate meteorological intelligence assistant powered by live Open-Meteo and India Meteorological Department (IMD) / NDMA data.`,
    `Current reference dates (India Standard Time): today is ${today}, tomorrow is ${tomorrow}.`,
    `Active conversation context -> Location: ${activeLocation || 'None yet'}, Target Date: ${activeDate || today}.`,
    getRoleGuidance(userType),
    `STRICT GROUNDING RULES:`,
    `1. Never invent, guess, or fabricate temperatures, rain probabilities, wind speeds, forecasts, flood probabilities, or official alerts. Always invoke the appropriate weather or flood prediction tool(s) first.`,
    `2. Follow-up context retention: If the user asks a follow-up question without specifying a location (e.g., "What about in the morning?" or "Should I carry an umbrella?"), automatically use the active conversation Location (${activeLocation || 'ask if none'}) and Target Date (${activeDate || today}). If the user introduces a new city (e.g., "What about Delhi?") without changing the date, query the new city while keeping the active Target Date.`,
    `3. Clearly distinguish official IMD/NDMA/CWC warnings from derived meteorological advisories or experimental ML 3-day flood-onset predictions. Never present the XGBoost flood prediction as an official government warning.`,
    `4. When the user asks about flood risk or flood probability, call get_flood_prediction. If status is "unavailable", clearly explain the exact reason returned (e.g. unsupported district, outside June–October monsoon season, missing Open-Meteo features, or missing model artifacts) without inventing any probability.`,
    `5. Always cite the data source (e.g., Open-Meteo Forecast API, Open-Meteo Historical Archive, IMD/NDMA CAP Feed, UP XGBoost Flood ML Service) in your answer.`,
    `6. Language requirement: Respond entirely in ${langMeta.name} (${langMeta.nativeName}) using natural, clear phrasing.`,
  ].join('\n');
}

function deriveTitle(userMessage: string): string {
  const cleaned = userMessage.replace(/[?!.]+$/g, '').trim();
  if (!cleaned) return 'Weather Inquiry';
  return cleaned.length > 48 ? `${cleaned.slice(0, 45).trim()}...` : cleaned;
}

export async function runWeatherGptTurn(params: {
  conversationId: string;
  userMessage: string;
  language: SupportedLanguageCode;
  userType?: UserRoleType;
  defaultLocation?: string;
}): Promise<{
  conversation: ConversationRecord;
  messages: ChatMessageRecord[];
  newMessages: ChatMessageRecord[];
}> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GROQ_API_KEY') {
    const err = new Error(
      'GROQ_API_KEY is not configured on the server. Add GROQ_API_KEY in .env or AI Studio Secrets to enable WeatherGPT.'
    ) as Error & { code?: string; status?: number };
    err.code = 'GROQ_API_KEY_MISSING';
    err.status = 503;
    throw err;
  }

  let conversation = await chatRepo.getConversation(params.conversationId);
  if (!conversation) {
    throw new Error('Conversation not found.');
  }

  const effectiveRole: UserRoleType = params.userType || conversation.user_type || 'citizen';
  const existingMessages = await chatRepo.getMessages(conversation.id);
  const newMessages: ChatMessageRecord[] = [];

  const systemPrompt = buildSystemPrompt(
    params.language,
    conversation.active_location || params.defaultLocation || null,
    conversation.active_date,
    effectiveRole
  );

  // Persist initial system prompt in DB if conversation has no messages yet
  if (existingMessages.length === 0) {
    const sysMsg = await chatRepo.appendMessage({
      conversation_id: conversation.id,
      role: 'system',
      content: systemPrompt,
      language: params.language,
    });
    newMessages.push(sysMsg);
  }

  // Persist user message
  const userRec = await chatRepo.appendMessage({
    conversation_id: conversation.id,
    role: 'user',
    content: params.userMessage,
    language: params.language,
  });
  newMessages.push(userRec);

  // Auto-title on first user message
  if (
    conversation.title === 'New Weather Conversation' ||
    conversation.title === 'New Chat'
  ) {
    const updated = await chatRepo.updateConversation(conversation.id, {
      title: deriveTitle(params.userMessage),
      language: params.language,
      user_type: effectiveRole,
    });
    if (updated) conversation = updated;
  } else if (conversation.language !== params.language || conversation.user_type !== effectiveRole) {
    const updated = await chatRepo.updateConversation(conversation.id, {
      language: params.language,
      user_type: effectiveRole,
    });
    if (updated) conversation = updated;
  }

  // Reconstruct Groq messages from persisted DB history (replacing system prompt with fresh contextual one)
  const allHistory = await chatRepo.getMessages(conversation.id);
  const groqMessages: Array<Record<string, unknown>> = [
    { role: 'system', content: systemPrompt },
  ];

  for (const m of allHistory) {
    if (m.role === 'system') continue;
    if (m.role === 'user') {
      groqMessages.push({ role: 'user', content: m.content });
    } else if (m.role === 'assistant') {
      if (m.tool_calls && m.tool_calls.length > 0) {
        groqMessages.push({
          role: 'assistant',
          content: m.content || '',
          tool_calls: m.tool_calls.map((tc) => ({
            id: tc.id,
            type: 'function',
            function: {
              name: tc.name,
              arguments: JSON.stringify(tc.arguments),
            },
          })),
        });
      } else {
        groqMessages.push({ role: 'assistant', content: m.content });
      }
    } else if (m.role === 'tool') {
      groqMessages.push({
        role: 'tool',
        tool_call_id: m.tool_call_id,
        name: m.tool_name,
        content: typeof m.tool_result === 'string' ? m.tool_result : JSON.stringify(m.tool_result ?? m.content),
      });
    }
  }

  const model = process.env.GROQ_MODEL?.trim() || 'openai/gpt-oss-20b';
  let activeLoc = conversation.active_location || params.defaultLocation || null;
  let activeDate = conversation.active_date;

  // Tool-calling execution loop (up to 4 iterations)
  for (let step = 0; step < 4; step++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    let groqData: {
      choices?: Array<{
        message?: {
          role: string;
          content?: string | null;
          tool_calls?: Array<{
            id: string;
            type: 'function';
            function: { name: string; arguments: string };
          }>;
        };
      }>;
      error?: { message?: string };
    };

    try {
      const res = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: groqMessages,
          tools: WEATHER_TOOLS,
          tool_choice: 'auto',
          temperature: 0.2,
          max_completion_tokens: 4096,
        }),
      });

      groqData = (await res.json()) as typeof groqData;
      if (!res.ok) {
        throw new Error(groqData.error?.message || `Groq API returned HTTP ${res.status}`);
      }
    } finally {
      clearTimeout(timer);
    }

    const choiceMsg = groqData.choices?.[0]?.message;
    if (!choiceMsg) {
      throw new Error('Groq API returned an empty response.');
    }

    const rawToolCalls = choiceMsg.tool_calls ?? [];
    if (rawToolCalls.length > 0) {
      const parsedCalls: ToolCallRecord[] = rawToolCalls.map((tc) => {
        let parsedArgs: Record<string, unknown> = {};
        try {
          parsedArgs = JSON.parse(tc.function.arguments || '{}');
        } catch {
          parsedArgs = {};
        }
        return {
          id: tc.id,
          name: tc.function.name,
          arguments: parsedArgs,
        };
      });

      // Persist assistant tool-call message
      const assistantToolCallMsg = await chatRepo.appendMessage({
        conversation_id: conversation.id,
        role: 'assistant',
        content: choiceMsg.content || '',
        tool_calls: parsedCalls,
        language: params.language,
      });
      newMessages.push(assistantToolCallMsg);

      groqMessages.push({
        role: 'assistant',
        content: choiceMsg.content || '',
        tool_calls: rawToolCalls,
      });

      // Execute all requested weather tools
      for (const tc of parsedCalls) {
        let toolOutput: unknown;
        try {
          const exec = await executeWeatherTool(tc.name, tc.arguments, activeLoc, activeDate);
          toolOutput = exec.result;
          if (exec.resolvedLocation) activeLoc = exec.resolvedLocation;
          if (exec.resolvedDate) activeDate = exec.resolvedDate;
        } catch (err) {
          toolOutput = {
            error: true,
            message: err instanceof Error ? err.message : 'Weather tool execution failed.',
          };
        }

        const toolRec = await chatRepo.appendMessage({
          conversation_id: conversation.id,
          role: 'tool',
          content: JSON.stringify(toolOutput),
          tool_call_id: tc.id,
          tool_name: tc.name,
          tool_result: toolOutput,
          language: params.language,
        });
        newMessages.push(toolRec);

        groqMessages.push({
          role: 'tool',
          tool_call_id: tc.id,
          name: tc.name,
          content: JSON.stringify(toolOutput),
        });
      }

      // Persist updated location/date context
      const updatedConv = await chatRepo.updateConversation(conversation.id, {
        active_location: activeLoc,
        active_date: activeDate,
      });
      if (updatedConv) conversation = updatedConv;
      continue;
    }

    // Final assistant response
    const finalContent = (choiceMsg.content || '').trim();
    const finalRec = await chatRepo.appendMessage({
      conversation_id: conversation.id,
      role: 'assistant',
      content: finalContent || 'I could not formulate a response from the weather tools.',
      language: params.language,
    });
    newMessages.push(finalRec);
    break;
  }

  const finalMessages = await chatRepo.getMessages(conversation.id);
  return {
    conversation,
    messages: finalMessages,
    newMessages,
  };
}

export async function explainAlertWithGroq(params: {
  alert: OfficialAlert;
  userType: UserRoleType;
  language: SupportedLanguageCode;
}): Promise<{ explanation: string; is_official: false; model: string }> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GROQ_API_KEY') {
    const err = new Error(
      'GROQ_API_KEY is not configured on the server. Add GROQ_API_KEY to enable AI alert simplification.'
    ) as Error & { code?: string; status?: number };
    err.code = 'GROQ_API_KEY_MISSING';
    err.status = 503;
    throw err;
  }

  const langMeta = SUPPORTED_LANGUAGES.find((l) => l.code === params.language) ?? SUPPORTED_LANGUAGES[0];
  const model = process.env.GROQ_MODEL?.trim() || 'openai/gpt-oss-20b';

  const prompt = [
    `Simplify the following official government weather warning into clear, practical guidance tailored to the user role below.`,
    `Do NOT alter the official severity (${params.alert.severity}) or present your suggestions as official government directives.`,
    `Respond strictly in ${langMeta.name} (${langMeta.nativeName}) with short bullet points covering:`,
    params.userType === 'citizen'
      ? `- What is happening\n- Which area is affected and when\n- Everyday safety & travel precautions`
      : params.userType === 'farmer'
      ? `- How this weather may affect farming activities\n- Practical precautions for crops, livestock, or equipment\n- Whether irrigation or spraying plans should be reviewed`
      : params.userType === 'government'
      ? `- Affected districts and area scope\n- Warning validity window\n- Areas requiring administrative monitoring`
      : `- Expected severe weather event\n- Affected areas and timeline\n- Operational preparedness suggestions (non-official)`,
    `\nOFFICIAL WARNING DATA:`,
    `Title: ${params.alert.title}`,
    `Issuing Authority: ${params.alert.issuing_authority}`,
    `Official Severity: ${params.alert.severity} (${params.alert.official_severity_label || params.alert.severity})`,
    `Affected Area: ${params.alert.affected_area}`,
    `Valid From: ${params.alert.valid_from || 'Not specified'} | Valid Until: ${params.alert.valid_until || 'Not specified'}`,
    `Official Description: ${params.alert.description}`,
  ].join('\n');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: `You simplify official weather bulletins clearly without jargon. ${getRoleGuidance(params.userType)}`,
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_completion_tokens: 1024,
      }),
    });
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      error?: { message?: string };
    };
    if (!res.ok) {
      throw new Error(data.error?.message || `Groq API HTTP ${res.status}`);
    }
    const text = (data.choices?.[0]?.message?.content || '').trim();
    return {
      explanation: text || 'Unable to generate explanation.',
      is_official: false,
      model,
    };
  } finally {
    clearTimeout(timer);
  }
}
