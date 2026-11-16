import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  Moon,
  Snowflake,
  Sun,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type TempUnit = 'C' | 'F';

export function convertTemp(tempC: number, unit: TempUnit): number {
  if (unit === 'F') {
    return (tempC * 9) / 5 + 32;
  }
  return tempC;
}

export function formatTemp(tempC: number, unit: TempUnit, decimals = 1): string {
  const val = convertTemp(tempC, unit);
  return `${val.toFixed(decimals)}°${unit}`;
}

export function formatShortTime(isoStr: string | null | undefined): string {
  if (!isoStr) return '—';
  const match = isoStr.match(/T(\d{2}:\d{2})/);
  if (match) return match[1];
  const dt = new Date(isoStr);
  if (Number.isNaN(dt.getTime())) return isoStr;
  return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

const LOCALE_MAP: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  gu: 'gu-IN',
  mr: 'mr-IN',
};

export function formatDayLabel(dateStr: string, lang = 'en'): string {
  const dt = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return dateStr;
  return dt.toLocaleDateString(LOCALE_MAP[lang] || 'en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatShortDate(dateStr: string, lang = 'en'): string {
  const dt = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return dateStr;
  return dt.toLocaleDateString(LOCALE_MAP[lang] || 'en-IN', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatTimestamp(isoStr: string | null | undefined, lang = 'en'): string {
  if (!isoStr) return '—';
  const dt = new Date(isoStr);
  if (Number.isNaN(dt.getTime())) return isoStr;
  return dt.toLocaleString(LOCALE_MAP[lang] || 'en-IN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getWeatherIcon(code: number, isDay = true): LucideIcon {
  if (code === 0 || code === 1) return isDay ? Sun : Moon;
  if (code === 2) return CloudSun;
  if (code === 3) return Cloud;
  if (code === 45 || code === 48) return CloudFog;
  if (code >= 51 && code <= 57) return CloudDrizzle;
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return CloudRain;
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return Snowflake;
  if (code >= 95) return CloudLightning;
  return Cloud;
}

export function getSessionId(): string {
  const key = 'weathergpt_session_id';
  let existing = window.localStorage.getItem(key);
  if (!existing) {
    existing = `sess-${crypto.randomUUID()}`;
    window.localStorage.setItem(key, existing);
  }
  return existing;
}
