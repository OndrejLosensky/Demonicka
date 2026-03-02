import { useColorScheme } from 'react-native';
import { useThemeStore, type ThemePreference } from '../store/theme.store';

export function useTheme() {
  const systemScheme = useColorScheme();
  const preference = useThemeStore((s) => s.preference);

  const resolved: 'light' | 'dark' =
    preference === 'system'
      ? systemScheme === 'dark'
        ? 'dark'
        : 'light'
      : preference;

  const isDark = resolved === 'dark';
  const setPreference = useThemeStore((s) => s.setPreference);

  return {
    preference,
    resolved,
    isDark,
    setPreference,
  };
}
