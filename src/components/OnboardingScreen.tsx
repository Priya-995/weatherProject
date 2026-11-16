import {
  ArrowRight,
  Building2,
  Check,
  CloudSun,
  Globe,
  ShieldAlert,
  Sprout,
  User,
} from 'lucide-react';
import { getDict } from '../i18n/translations.ts';
import { UI_LANGUAGES, type UILanguageCode, type UserRoleType } from '../types/weather.ts';

interface OnboardingScreenProps {
  language: UILanguageCode;
  userType: UserRoleType;
  onSelectLanguage: (lang: UILanguageCode) => void;
  onSelectUserType: (role: UserRoleType) => void;
  onComplete: () => void;
}

const ROLE_CARDS: Array<{ id: UserRoleType; icon: typeof User }> = [
  { id: 'citizen', icon: User },
  { id: 'farmer', icon: Sprout },
  { id: 'government', icon: Building2 },
  { id: 'disaster', icon: ShieldAlert },
];

export function OnboardingScreen({
  language,
  userType,
  onSelectLanguage,
  onSelectUserType,
  onComplete,
}: OnboardingScreenProps) {
  const dict = getDict(language);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl space-y-8">
        {/* Header Brand & Title */}
        <header className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-sky-600 dark:text-sky-400">
            <CloudSun className="h-4 w-4" />
            <span>{dict.appName}</span>
            <span aria-hidden="true">·</span>
            <span>{dict.onboarding.badge}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            {dict.onboarding.title}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            {dict.onboarding.subtitle}
          </p>
        </header>

        {/* Step A: Language Cards */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 shrink-0">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {dict.onboarding.stepLanguageTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {dict.onboarding.stepLanguageHint}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {UI_LANGUAGES.map((lang) => {
              const selected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => onSelectLanguage(lang.code)}
                  className={`text-left rounded-xl border p-4 transition-all flex flex-col justify-between gap-2 ${
                    selected
                      ? 'border-sky-600 bg-sky-50/70 dark:bg-sky-950/30 ring-2 ring-sky-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {lang.nativeName}
                    </span>
                    {selected && (
                      <Check className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
                    )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {lang.name} · {lang.scriptSample}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Step B: User Role Cards */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {dict.onboarding.stepRoleTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {dict.onboarding.stepRoleHint}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ROLE_CARDS.map((card) => {
              const Icon = card.icon;
              const roleText = dict.roles[card.id];
              const selected = userType === card.id;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => onSelectUserType(card.id)}
                  className={`text-left rounded-xl border p-5 transition-all flex flex-col justify-between gap-4 ${
                    selected
                      ? 'border-sky-600 bg-sky-50/70 dark:bg-sky-950/30 ring-2 ring-sky-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          selected
                            ? 'bg-sky-600 text-white'
                            : 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      {selected && (
                        <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                          {dict.onboarding.selectedTag}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        {roleText.label}
                      </h3>
                      <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {roleText.shortDesc}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`w-full rounded-lg px-3 py-2 text-center text-xs font-semibold transition-colors whitespace-nowrap ${
                      selected
                        ? 'bg-sky-600 text-white'
                        : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {selected ? dict.onboarding.selectedTag : roleText.selectAction}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Continue Action */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {dict.onboarding.savedNotice}
          </p>
          <button
            type="button"
            onClick={onComplete}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-6 py-3 text-sm font-semibold text-white hover:bg-sky-700 transition-colors whitespace-nowrap shrink-0"
          >
            <span>{dict.onboarding.continueBtn}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
