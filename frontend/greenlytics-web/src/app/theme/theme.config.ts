import { themes, type ThemeName } from '@/app/theme/themes';

export interface ThemeConfig {
  defaultTheme: ThemeName;
  themes: typeof themes;
}

export const themeConfig: ThemeConfig = {
  defaultTheme: 'light',
  themes,
};
