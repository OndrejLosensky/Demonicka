import { useTheme } from './useTheme';

/**
 * Central palette for light/dark with safe contrast.
 * Use across all screens for consistent theme support.
 */
export function useThemeColors() {
  const { isDark } = useTheme();

  if (isDark) {
    return {
      bg: '#0f172a',
      bgSecondary: '#1e293b',
      card: '#1e293b',
      cardBorder: '#334155',
      text: '#f1f5f9',
      textSecondary: '#cbd5e1',
      textMuted: '#94a3b8',
      border: '#334155',
      red: '#ef4444',
      redBg: '#450a0a',
      green: '#22c55e',
      greenBg: '#14532d',
      amber: '#f59e0b',
      amberBg: '#451a03',
      primary: '#FF0000',
      inputBg: '#1e293b',
      tabBarBg: '#0f172a',
      tabBarBorder: '#334155',
    } as const;
  }

  return {
    bg: '#ffffff',
    bgSecondary: '#f8fafc',
    card: '#f1f5f9',
    cardBorder: '#e2e8f0',
    text: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#64748b',
    border: '#e2e8f0',
    red: '#dc2626',
    redBg: '#fef2f2',
    green: '#16a34a',
    greenBg: '#dcfce7',
    amber: '#d97706',
    amberBg: '#fef3c7',
    primary: '#FF0000',
    inputBg: '#f8fafc',
    tabBarBg: '#ffffff',
    tabBarBorder: '#f1f5f9',
  } as const;
}
