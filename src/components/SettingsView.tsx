import {
  Building2,
  Check,
  Globe,
  Moon,
  RotateCcw,
  ShieldAlert,
  Sprout,
  Sun,
  User,
} from 'lucide-react';
import { getDict } from '../i18n/translations.ts';
import { UI_LANGUAGES, type UILanguageCode, type UserRoleType } from '../types/weather.ts';
import type { TempUnit } from '../utils/weatherFormat.ts';

interface SettingsViewProps {
  language: UILanguageCode;
  userType: UserRoleType;
  unit: TempUnit;
  theme: 'light' | 'dark';
  onChangeLanguage: (lang: UILanguageCode) => void;
  onChangeUserType: (role: UserRoleType) => void;
  onChangeUnit: (unit: TempUnit) => void;
  onChangeTheme: (theme: 'light' | 'dark') => void;
  onReopenOnboarding: () => void;
}

const ROLE_CARDS: Array<{ id: UserRoleType; icon: typeof User }> = [
  { id: 'citizen', icon: User },
  { id: 'farmer', icon: Sprout },
  { id: 'government', icon: Building2 },
  { id: 'disaster', icon: ShieldAlert },
];

export function SettingsView({
  language,
  userType,
  unit,
  theme,
  onChangeLanguage,
  onChangeUserType,
  onChangeUnit,
  onChangeTheme,
  onReopenOnboarding,
}: SettingsViewProps) {
  const dict = getDict(language);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          {dict.settings.heading}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {dict.settings.subheading}
        </p>
      </div>

      {/* Language Selection */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <Globe className="h-5 w-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {dict.settings.languageCardTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {dict.settings.languageCardSub}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {UI_LANGUAGES.map((lang) => {
            const active = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => onChangeLanguage(lang.code)}
                className={`text-left rounded-xl border p-4 transition-colors flex items-center justify-between gap-2 ${
                  active
                    ? 'border-sky-600 bg-sky-50/70 dark:bg-sky-950/30'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {lang.nativeName}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{lang.name}</div>
                </div>
                {active && <Check className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* Role / Experience Selection */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {dict.settings.roleCardTitle}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {dict.settings.roleCardSub}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ROLE_CARDS.map((card) => {
            const Icon = card.icon;
            const text = dict.roles[card.id];
            const active = userType === card.id;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => onChangeUserType(card.id)}
                className={`text-left rounded-xl border p-4 transition-colors space-y-3 ${
                  active
                    ? 'border-sky-600 bg-sky-50/70 dark:bg-sky-950/30'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                      active
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  {active && (
                    <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                      {dict.settings.activeBadge}
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {text.label}
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {text.shortDesc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Display & Units */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {dict.settings.displayCardTitle}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {dict.settings.displayCardSub}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {dict.settings.unitLabel}
            </div>
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-1">
              {(['C', 'F'] as TempUnit[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => onChangeUnit(u)}
                  className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-md transition-colors whitespace-nowrap ${
                    unit === u
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  °{u}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {dict.settings.themeLabel}
            </div>
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-1">
              <button
                type="button"
                onClick={() => onChangeTheme('light')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  theme === 'light'
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Sun className="h-3.5 w-3.5" />
                <span>{dict.common.lightTheme}</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeTheme('dark')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  theme === 'dark'
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Moon className="h-3.5 w-3.5" />
                <span>{dict.common.darkTheme}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Re-open Setup */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {dict.settings.resetOnboardingTitle}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {dict.settings.resetOnboardingSub}
          </p>
        </div>
        <button
          type="button"
          onClick={onReopenOnboarding}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>{dict.settings.resetOnboardingBtn}</span>
        </button>
      </section>
    </div>
  );
}
