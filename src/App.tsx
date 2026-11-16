import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Bot,
  Box,
  Building2,
  CalendarDays,
  CloudSun,
  Globe,
  LayoutDashboard,
  Map as MapIcon,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldAlert,
  Sprout,
  Sun,
  User,
  X,
} from 'lucide-react';
import { AlertsView } from './components/AlertsView.tsx';
import { AnalyticsView } from './components/AnalyticsView.tsx';
import { AssistantView } from './components/AssistantView.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { ForecastView } from './components/ForecastView.tsx';
import { LocationSearch } from './components/LocationSearch.tsx';
import { MapView } from './components/MapView.tsx';
import { OnboardingScreen } from './components/OnboardingScreen.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { ThreeWeatherScene } from './components/ThreeWeatherScene.tsx';
import { getFeatureDict } from './i18n/featureTranslations.ts';
import { getDict } from './i18n/translations.ts';
import {
  UI_LANGUAGES,
  type LocationResult,
  type NavSection,
  type NormalizedWeatherResponse,
  type UILanguageCode,
  type UserRoleType,
} from './types/weather.ts';
import type { TempUnit } from './utils/weatherFormat.ts';

interface StoredPrefs {
  language: UILanguageCode;
  userType: UserRoleType;
  onboarded: boolean;
  unit: TempUnit;
  theme: 'light' | 'dark';
}

const PREFS_KEY = 'weathergpt_prefs';

function loadStoredPrefs(): StoredPrefs {
  const defaultTheme: 'light' | 'dark' =
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';

  if (typeof window === 'undefined') {
    return { language: 'en', userType: 'citizen', onboarded: false, unit: 'C', theme: 'light' };
  }

  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredPrefs>;
      const validLang: UILanguageCode =
        parsed.language === 'hi' || parsed.language === 'gu' || parsed.language === 'mr'
          ? parsed.language
          : 'en';
      const validRole: UserRoleType =
        parsed.userType === 'farmer' ||
        parsed.userType === 'government' ||
        parsed.userType === 'disaster'
          ? parsed.userType
          : 'citizen';
      const validTheme: 'light' | 'dark' =
        parsed.theme === 'dark' || parsed.theme === 'light' ? parsed.theme : defaultTheme;
      const validUnit: TempUnit = parsed.unit === 'F' ? 'F' : 'C';
      return {
        language: validLang,
        userType: validRole,
        onboarded: Boolean(parsed.onboarded),
        unit: validUnit,
        theme: validTheme,
      };
    }
  } catch {
    // ignore corrupted local storage
  }

  const legacyTheme = window.localStorage.getItem('weathergpt_theme');
  return {
    language: 'en',
    userType: 'citizen',
    onboarded: false,
    unit: 'C',
    theme: legacyTheme === 'dark' || legacyTheme === 'light' ? legacyTheme : defaultTheme,
  };
}

const DEFAULT_LOCATION: LocationResult = {
  id: 'in-ahm',
  name: 'Ahmedabad',
  admin1: 'Gujarat',
  country: 'India',
  country_code: 'IN',
  latitude: 23.0225,
  longitude: 72.5714,
  timezone: 'Asia/Kolkata',
};

const ROLE_ICON: Record<UserRoleType, typeof User> = {
  citizen: User,
  farmer: Sprout,
  government: Building2,
  disaster: ShieldAlert,
};

export default function App() {
  const [prefs, setPrefs] = useState<StoredPrefs>(() => loadStoredPrefs());
  const [activeNav, setActiveNav] = useState<NavSection>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationResult>(DEFAULT_LOCATION);

  const [dashboardWeather, setDashboardWeather] = useState<NormalizedWeatherResponse | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [pendingAssistantPrompt, setPendingAssistantPrompt] = useState<string | null>(null);
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);

  const dict = getDict(prefs.language);
  const fDict = getFeatureDict(prefs.language);

  useEffect(() => {
    const onQuotaExceeded = () => setMapsQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuotaExceeded);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (prefs.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.lang = prefs.language;
    window.localStorage.setItem('weathergpt_theme', prefs.theme);
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }, [prefs]);

  const fetchDashboardWeather = async (loc: LocationResult) => {
    setDashboardLoading(true);
    setDashboardError(null);
    try {
      const params = new URLSearchParams({
        lat: String(loc.latitude),
        lon: String(loc.longitude),
        name: loc.name,
        country: loc.country,
      });
      if (loc.admin1) params.set('admin1', loc.admin1);
      if (loc.country_code) params.set('country_code', loc.country_code);

      const res = await fetch(`/api/weather?${params.toString()}`);
      if (!res.ok) {
        const errPayload = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(errPayload.message || 'Unable to load live Open-Meteo weather data.');
      }
      const json = (await res.json()) as NormalizedWeatherResponse;
      setDashboardWeather(json);
    } catch (err) {
      setDashboardError(err instanceof Error ? err.message : 'Weather service unavailable.');
    } finally {
      setDashboardLoading(false);
    }
  };

  useEffect(() => {
    if (!prefs.onboarded) return;
    fetchDashboardWeather(selectedLocation);
  }, [
    prefs.onboarded,
    selectedLocation.latitude,
    selectedLocation.longitude,
    selectedLocation.name,
  ]);

  // Role-tailored navigation order & localized labels
  const navItems = useMemo(() => {
    const all: Record<NavSection, { id: NavSection; label: string; icon: typeof LayoutDashboard }> = {
      dashboard: { id: 'dashboard', label: dict.nav.dashboard, icon: LayoutDashboard },
      assistant: { id: 'assistant', label: dict.nav.assistant, icon: Bot },
      forecast: { id: 'forecast', label: dict.nav.forecast, icon: CalendarDays },
      map: { id: 'map', label: dict.nav.map, icon: MapIcon },
      scene3d: { id: 'scene3d', label: fDict.navScene3d, icon: Box },
      alerts: { id: 'alerts', label: dict.nav.alerts, icon: AlertTriangle },
      analytics: { id: 'analytics', label: dict.nav.analytics, icon: BarChart3 },
      settings: { id: 'settings', label: dict.nav.settings, icon: Settings },
    };

    const orderByRole: Record<UserRoleType, NavSection[]> = {
      citizen: ['dashboard', 'assistant', 'forecast', 'alerts', 'map', 'scene3d', 'analytics', 'settings'],
      farmer: ['dashboard', 'forecast', 'alerts', 'assistant', 'analytics', 'map', 'scene3d', 'settings'],
      government: ['dashboard', 'alerts', 'map', 'scene3d', 'analytics', 'forecast', 'assistant', 'settings'],
      disaster: ['dashboard', 'alerts', 'map', 'scene3d', 'assistant', 'forecast', 'analytics', 'settings'],
    };

    return orderByRole[prefs.userType].map((id) => all[id]);
  }, [dict, fDict, prefs.userType]);

  if (!prefs.onboarded) {
    return (
      <OnboardingScreen
        language={prefs.language}
        userType={prefs.userType}
        onSelectLanguage={(language) => setPrefs((p) => ({ ...p, language }))}
        onSelectUserType={(userType) => setPrefs((p) => ({ ...p, userType }))}
        onComplete={() => {
          setPrefs((p) => ({ ...p, onboarded: true }));
          setActiveNav('dashboard');
        }}
      />
    );
  }

  const activeNavMeta = navItems.find((item) => item.id === activeNav) ?? navItems[0];
  const ActiveRoleIcon = ROLE_ICON[prefs.userType];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {mapsQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      <div className="flex-1 flex">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Collapsible Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 lg:static flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-200 ${
          sidebarCollapsed ? 'lg:w-[76px]' : 'lg:w-64'
        } ${mobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              setActiveNav('dashboard');
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2.5 min-w-0"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-600 text-white shrink-0">
              <CloudSun className="h-5 w-5" />
            </div>
            {!sidebarCollapsed && (
              <div className="text-left min-w-0">
                <span className="block text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                  {dict.appName}
                </span>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {dict.roles[prefs.userType].label}
                </span>
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation drawer"
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Primary Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveNav(item.id);
                  setMobileMenuOpen(false);
                }}
                title={sidebarCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
          <button
            type="button"
            onClick={() =>
              setPrefs((p) => ({ ...p, theme: p.theme === 'dark' ? 'light' : 'dark' }))
            }
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap"
          >
            {prefs.theme === 'dark' ? (
              <Sun className="h-4 w-4 shrink-0 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 shrink-0" />
            )}
            {!sidebarCollapsed && (
              <span>{prefs.theme === 'dark' ? dict.common.lightTheme : dict.common.darkTheme}</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSidebarCollapsed((c) => !c)}
            className="hidden lg:flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100 transition-colors whitespace-nowrap"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4 shrink-0" />
            ) : (
              <PanelLeftClose className="h-4 w-4 shrink-0" />
            )}
            {!sidebarCollapsed && <span>{dict.common.collapseSidebar}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="min-h-16 px-4 sm:px-6 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap truncate">
              {activeNavMeta.label}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 flex-1 justify-end max-w-3xl">
            <LocationSearch
              selectedLocation={selectedLocation}
              onSelectLocation={(loc) => setSelectedLocation(loc)}
              language={prefs.language}
            />

            {/* Global Language Selector */}
            <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 shrink-0">
              <Globe className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
              <select
                value={prefs.language}
                onChange={(e) =>
                  setPrefs((p) => ({ ...p, language: e.target.value as UILanguageCode }))
                }
                aria-label={dict.common.languageLabel}
                className="bg-transparent focus:outline-none cursor-pointer"
              >
                {UI_LANGUAGES.map((l) => (
                  <option
                    key={l.code}
                    value={l.code}
                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    {l.nativeName}
                  </option>
                ))}
              </select>
            </label>

            {/* Active Role Quick Switch to Settings */}
            <button
              type="button"
              onClick={() => setActiveNav('settings')}
              title={dict.common.openSettings}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              <ActiveRoleIcon className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
              <span className="hidden sm:inline">{dict.roles[prefs.userType].label}</span>
            </button>

            {/* Temperature Unit Toggle */}
            <div
              className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-0.5 shrink-0"
              role="group"
              aria-label={dict.settings.unitLabel}
            >
              {(['C', 'F'] as TempUnit[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setPrefs((p) => ({ ...p, unit: u }))}
                  className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-md transition-colors whitespace-nowrap ${
                    prefs.unit === u
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  °{u}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-[1440px] w-full mx-auto">
          {activeNav === 'dashboard' && (
            <DashboardView
              weather={dashboardWeather}
              selectedLocation={selectedLocation}
              loading={dashboardLoading}
              error={dashboardError}
              unit={prefs.unit}
              language={prefs.language}
              userType={prefs.userType}
              onRefresh={() => fetchDashboardWeather(selectedLocation)}
              onQuickCity={(loc) => setSelectedLocation(loc)}
              onAskAssistant={(prompt) => {
                setPendingAssistantPrompt(prompt);
                setActiveNav('assistant');
              }}
              onOpenAlerts={() => setActiveNav('alerts')}
            />
          )}

          {activeNav === 'assistant' && (
            <AssistantView
              selectedLocation={selectedLocation}
              uiLanguage={prefs.language}
              userType={prefs.userType}
              pendingPrompt={pendingAssistantPrompt}
              onConsumePendingPrompt={() => setPendingAssistantPrompt(null)}
            />
          )}

          {activeNav === 'forecast' && (
            <ForecastView
              selectedLocation={selectedLocation}
              unit={prefs.unit}
              language={prefs.language}
            />
          )}

          {activeNav === 'map' && (
            <MapView
              selectedLocation={selectedLocation}
              onSelectLocation={(loc) => setSelectedLocation(loc)}
              unit={prefs.unit}
              language={prefs.language}
              theme={prefs.theme}
              onOpen3dScene={() => setActiveNav('scene3d')}
            />
          )}

          {activeNav === 'scene3d' && (
            <ThreeWeatherScene
              weather={dashboardWeather}
              selectedLocation={selectedLocation}
              unit={prefs.unit}
              language={prefs.language}
              theme={prefs.theme}
              onBack={() => setActiveNav('dashboard')}
            />
          )}

          {activeNav === 'alerts' && (
            <AlertsView
              selectedLocation={selectedLocation}
              language={prefs.language}
              userType={prefs.userType}
            />
          )}

          {activeNav === 'analytics' && (
            <AnalyticsView
              selectedLocation={selectedLocation}
              unit={prefs.unit}
              language={prefs.language}
            />
          )}

          {activeNav === 'settings' && (
            <SettingsView
              language={prefs.language}
              userType={prefs.userType}
              unit={prefs.unit}
              theme={prefs.theme}
              onChangeLanguage={(language) => setPrefs((p) => ({ ...p, language }))}
              onChangeUserType={(userType) => setPrefs((p) => ({ ...p, userType }))}
              onChangeUnit={(unit) => setPrefs((p) => ({ ...p, unit }))}
              onChangeTheme={(theme) => setPrefs((p) => ({ ...p, theme }))}
              onReopenOnboarding={() => setPrefs((p) => ({ ...p, onboarded: false }))}
            />
          )}
        </main>
      </div>
      </div>
    </div>
  );
}
