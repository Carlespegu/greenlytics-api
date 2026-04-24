import type { PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { themeConfig } from '@/app/theme/theme.config';
import type { ThemeDefinition, ThemeName } from '@/app/theme/themes';

interface ThemeContextValue {
  theme: ThemeName;
  themes: Array<{ value: ThemeName; label: string }>;
  setTheme: (theme: ThemeName) => void;
  definition: ThemeDefinition;
}

const STORAGE_KEY = 'greenlytics:theme';

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveBrowserTheme(): ThemeName {
  if (typeof window === 'undefined') {
    return themeConfig.defaultTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(definition: ThemeDefinition) {
  const root = document.documentElement;

  root.dataset.theme = definition.name;
  root.style.colorScheme = definition.colorScheme;

  Object.entries(definition.colors).forEach(([token, value]) => {
    root.style.setProperty(`--theme-${token}`, value);
  });

  Object.entries(definition.radii).forEach(([token, value]) => {
    root.style.setProperty(`--theme-radius-${token}`, value);
  });
}

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    if (typeof window === 'undefined') {
      return themeConfig.defaultTheme;
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }

    return themeConfig.defaultTheme ?? resolveBrowserTheme();
  });

  useEffect(() => {
    const definition = themeConfig.themes[theme];
    applyTheme(definition);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    themes: (Object.keys(themeConfig.themes) as ThemeName[]).map((value) => ({
      value,
      label: value,
    })),
    setTheme: setThemeState,
    definition: themeConfig.themes[theme],
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}
