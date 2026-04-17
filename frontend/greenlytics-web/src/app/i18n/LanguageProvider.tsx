import type { PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { defaultLocale, localeLabels, messages, type Locale } from '@/app/i18n/messages';

type TranslationParams = Record<string, string | number>;

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  locales: Array<{ value: Locale; label: string }>;
  t: (key: string, params?: TranslationParams) => string;
}

const STORAGE_KEY = 'greenlytics:locale';

const LanguageContext = createContext<LanguageContextValue | null>(null);

function resolveBrowserLocale(): Locale {
  if (typeof window === 'undefined') {
    return defaultLocale;
  }

  const browserLanguage = window.navigator.language.toLowerCase();

  if (browserLanguage.startsWith('es')) {
    return 'es';
  }

  if (browserLanguage.startsWith('en')) {
    return 'en';
  }

  return 'ca';
}

function resolveMessage(locale: Locale, key: string) {
  const entry = key.split('.').reduce<unknown>((current, segment) => {
    if (!current || typeof current !== 'object') {
      return undefined;
    }

    return (current as Record<string, unknown>)[segment];
  }, messages[locale]);

  return typeof entry === 'string' ? entry : undefined;
}

function interpolate(template: string, params?: TranslationParams) {
  if (!params) {
    return template;
  }

  return Object.entries(params).reduce(
    (current, [key, value]) => current.replaceAll(`{{${key}}}`, String(value)),
    template,
  );
}

export function LanguageProvider({ children }: PropsWithChildren) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === 'undefined') {
      return defaultLocale;
    }

    const storedLocale = window.localStorage.getItem(STORAGE_KEY);
    if (storedLocale === 'ca' || storedLocale === 'es' || storedLocale === 'en') {
      return storedLocale;
    }

    return resolveBrowserLocale();
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<LanguageContextValue>(() => ({
    locale,
    setLocale: setLocaleState,
    locales: (Object.keys(localeLabels) as Locale[]).map((value) => ({
      value,
      label: localeLabels[value],
    })),
    t: (key, params) => {
      const translated = resolveMessage(locale, key)
        ?? resolveMessage(defaultLocale, key)
        ?? key;

      return interpolate(translated, params);
    },
  }), [locale]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useI18n must be used within LanguageProvider');
  }

  return context;
}
