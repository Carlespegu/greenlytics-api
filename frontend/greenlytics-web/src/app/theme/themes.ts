export type ThemeName = 'light' | 'dark';

export interface ThemeDefinition {
  name: ThemeName;
  colorScheme: 'light' | 'dark';
  colors: {
    primary: string;
    primaryHover: string;
    primarySoft: string;
    primaryGlow: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    danger: string;
    info: string;
    background: string;
    backgroundSecondary: string;
    backgroundTertiary: string;
    appGradientStart: string;
    appGradientEnd: string;
    sidebar: string;
    sidebarSecondary: string;
    topbar: string;
    surface: string;
    surfaceSecondary: string;
    surfaceTertiary: string;
    surfaceMuted: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textInverse: string;
    border: string;
    borderStrong: string;
    borderMuted: string;
    hover: string;
    active: string;
    inputBackground: string;
    inputBorder: string;
    inputFocus: string;
    shadowSm: string;
    shadowMd: string;
    shadowLg: string;
    shadowInset: string;
    glowAmbientLeft: string;
    glowAmbientRight: string;
    tableHeader: string;
    tableRowHover: string;
    chartGrid: string;
  };
  radii: {
    xl: string;
    lg: string;
    md: string;
    sm: string;
  };
}

export const themes: Record<ThemeName, ThemeDefinition> = {
  light: {
    name: 'light',
    colorScheme: 'light',
    colors: {
      primary: '#22c55e',
      primaryHover: '#16a34a',
      primarySoft: 'rgba(33, 184, 88, 0.12)',
      primaryGlow: 'rgba(33, 184, 88, 0.2)',
      secondary: '#0f172a',
      accent: '#0284c7',
      success: '#16a34a',
      warning: '#d97706',
      danger: '#dc2626',
      info: '#0284c7',
      background: '#f8fafc',
      backgroundSecondary: '#ffffff',
      backgroundTertiary: '#f1f5f9',
      appGradientStart: '#f8fafc',
      appGradientEnd: '#eef5f2',
      sidebar: '#ffffff',
      sidebarSecondary: '#f8fafc',
      topbar: 'rgba(255, 255, 255, 0.92)',
      surface: '#ffffff',
      surfaceSecondary: '#f8fafc',
      surfaceTertiary: '#f1f5f9',
      surfaceMuted: '#e2e8f0',
      textPrimary: '#0f172a',
      textSecondary: '#475569',
      textMuted: '#64748b',
      textInverse: '#ffffff',
      border: '#e2e8f0',
      borderStrong: '#cbd5e1',
      borderMuted: 'rgba(148, 163, 184, 0.16)',
      hover: 'rgba(15, 23, 42, 0.035)',
      active: 'rgba(34, 197, 94, 0.12)',
      inputBackground: '#ffffff',
      inputBorder: '#d7e1ec',
      inputFocus: '#22c55e',
      shadowSm: '0 8px 18px rgba(15, 23, 42, 0.06)',
      shadowMd: '0 18px 40px rgba(15, 23, 42, 0.08)',
      shadowLg: '0 28px 60px rgba(15, 23, 42, 0.12)',
      shadowInset: 'inset 0 1px 0 rgba(255,255,255,0.75)',
      glowAmbientLeft: 'rgba(34, 197, 94, 0.12)',
      glowAmbientRight: 'rgba(2, 132, 199, 0.08)',
      tableHeader: '#f8fafc',
      tableRowHover: 'rgba(34, 197, 94, 0.04)',
      chartGrid: 'rgba(148, 163, 184, 0.22)',
    },
    radii: {
      xl: '32px',
      lg: '24px',
      md: '18px',
      sm: '14px',
    },
  },
  dark: {
    name: 'dark',
    colorScheme: 'dark',
    colors: {
      primary: '#22c55e',
      primaryHover: '#16a34a',
      primarySoft: 'rgba(34, 197, 94, 0.15)',
      primaryGlow: 'rgba(34, 197, 94, 0.25)',
      secondary: '#edf7f2',
      accent: '#38bdf8',
      success: '#22c55e',
      warning: '#fbbf24',
      danger: '#fb7185',
      info: '#38bdf8',
      background: '#081019',
      backgroundSecondary: '#0b1220',
      backgroundTertiary: '#0f172a',
      appGradientStart: '#081019',
      appGradientEnd: '#0a1322',
      sidebar: 'rgba(5, 12, 19, 0.94)',
      sidebarSecondary: 'rgba(9, 17, 25, 0.9)',
      topbar: 'rgba(21, 27, 39, 0.96)',
      surface: 'rgba(14, 27, 41, 0.96)',
      surfaceSecondary: 'rgba(11, 22, 34, 0.82)',
      surfaceTertiary: '#162338',
      surfaceMuted: '#111c2f',
      textPrimary: '#edf7f2',
      textSecondary: '#8ea3b3',
      textMuted: '#6d8799',
      textInverse: '#081019',
      border: 'rgba(148, 163, 184, 0.12)',
      borderStrong: 'rgba(148, 163, 184, 0.2)',
      borderMuted: 'rgba(255,255,255,0.06)',
      hover: 'rgba(255,255,255,0.04)',
      active: 'rgba(34, 197, 94, 0.14)',
      inputBackground: '#1e293b',
      inputBorder: 'rgba(148, 163, 184, 0.16)',
      inputFocus: '#22c55e',
      shadowSm: '0 12px 24px rgba(0, 0, 0, 0.18)',
      shadowMd: '0 24px 70px rgba(0, 0, 0, 0.28)',
      shadowLg: '0 28px 80px rgba(0, 0, 0, 0.34)',
      shadowInset: 'inset 0 1px 0 rgba(255,255,255,0.04)',
      glowAmbientLeft: 'rgba(54, 211, 153, 0.15)',
      glowAmbientRight: 'rgba(56, 189, 248, 0.14)',
      tableHeader: 'rgba(255,255,255,0.02)',
      tableRowHover: 'rgba(255,255,255,0.03)',
      chartGrid: 'rgba(148, 163, 184, 0.18)',
    },
    radii: {
      xl: '32px',
      lg: '24px',
      md: '18px',
      sm: '14px',
    },
  },
};
