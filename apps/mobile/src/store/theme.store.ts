import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'app_theme';

export type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeState {
  preference: ThemePreference;
  hydrated: boolean;
  setPreference: (p: ThemePreference) => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  preference: 'system',
  hydrated: false,

  setPreference: async (preference: ThemePreference) => {
    await AsyncStorage.setItem(THEME_KEY, preference);
    set({ preference });
  },

  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_KEY);
      const preference: ThemePreference =
        stored === 'light' || stored === 'dark' || stored === 'system'
          ? stored
          : 'system';
      set({ preference, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },
}));
