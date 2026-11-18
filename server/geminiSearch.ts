import { GoogleGenAI } from '@google/genai';
import {
  SUPPORTED_LANGUAGES,
  type SearchGroundingResponse,
  type SearchGroundingSource,
  type SupportedLanguageCode,
  type UserRoleType,
} from '../src/types/weather.ts';

let sharedAiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    const err = new Error(
      'GEMINI_API_KEY is not configured on the server. Add GEMINI_API_KEY in Settings > Secrets or .env to enable Google Search Grounding.'
    ) as Error & { code?: string; status?: number };
    err.code = 'GEMINI_API_KEY_MISSING';
    err.status = 503;
    throw err;
  }

  if (!sharedAiClient) {
    sharedAiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return sharedAiClient;
}

function getRoleContext(userType: UserRoleType): string {
  switch (userType) {
    case 'farmer':
      return 'Tailor findings to agricultural impact: rainfall bulletins, IMD Agromet notes, irrigation/reservoir updates, and crop-safe precautions in plain language.';
    case 'government':
      return 'Tailor findings to administrative & district monitoring: cite official IMD, NDMA, state disaster authority, or municipal press releases and timelines.';
    case 'disaster':
      return 'Tailor findings to emergency readiness & operations: highlight severe weather advisories, cyclone/flood bulletins, river levels, road/rail disruptions, and relief notices.';
    case 'citizen':
    default:
      return 'Tailor findings to everyday citizens: local weather news, travel or school/commute advisories, and practical safety tips in clear everyday language.';
  }
}

export async function queryWeatherWithSearchGrounding(params: {
  query: string;
  location?: string;
  language?: SupportedLanguageCode;
  userType?: UserRoleType;
}): Promise<SearchGroundingResponse> {
  const ai = getGeminiClient();
  const langCode = params.language || 'en';
  const langMeta = SUPPORTED_LANGUAGES.find((l) => l.code === langCode) ?? SUPPORTED_LANGUAGES[0];
  const userType = params.userType || 'citizen';
  const locationLabel = params.location?.trim() || 'India';
  const nowIso = new Date().toISOString();

  const systemInstruction = [
    `You are WeatherGPT Live Web Verification, powered by Gemini 4 with Google Search Grounding.`,
    `Current UTC timestamp: ${nowIso}. Focus location context: ${locationLabel}.`,
    getRoleContext(userType),
    `RULES:`,
    `1. Use Google Search results to report only verified, up-to-date facts, IMD/NDMA bulletins, local news, and real-time weather/travel disruptions.`,
    `2. Do NOT fabricate alert severities, dates, or official statements if Search returns no recent bulletin — state clearly what was found vs not found.`,
    `3. Respond completely in ${langMeta.name} (${langMeta.nativeName}) with crisp bullet points and clear dates/timestamps where available.`,
  ].join('\n');

  const userPrompt = `Location context: ${locationLabel}\nQuestion: ${params.query.trim()}`;

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: userPrompt,
    config: {
      systemInstruction,
      tools: [{ googleSearch: {} }],
    },
  });

  const answer = (response.text ?? '').trim();
  const metadata = response.candidates?.[0]?.groundingMetadata;
  const rawChunks = metadata?.groundingChunks ?? [];

  const seenUris = new Set<string>();
  const sources: SearchGroundingSource[] = [];
  for (const chunk of rawChunks) {
    const uri = chunk.web?.uri?.trim();
    const title = chunk.web?.title?.trim() || uri;
    if (uri && !seenUris.has(uri)) {
      seenUris.add(uri);
      sources.push({ title: title || 'Web Source', uri });
    }
  }

  const webSearchQueries = Array.isArray(metadata?.webSearchQueries)
    ? metadata.webSearchQueries.filter((q): q is string => typeof q === 'string' && q.trim().length > 0)
    : [];

  return {
    query: params.query.trim(),
    answer: answer || 'No verified web summary was returned for this query.',
    sources,
    web_search_queries: webSearchQueries,
    model: 'gemini-4-hydrogen',
    checked_at: new Date().toISOString(),
  };
}
