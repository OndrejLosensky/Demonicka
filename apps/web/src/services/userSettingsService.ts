import { api } from './api';

export type UserSettings = {
  preferredTheme: 'light' | 'dark' | null;
  preferredLocale: 'cs' | 'en' | null;
};

export const userSettingsService = {
  async getMySettings(): Promise<UserSettings> {
    const response = await api.get('/users/me/settings');
    return response.data;
  },

  async updateMySettings(settings: {
    preferredTheme?: 'light' | 'dark' | null;
    preferredLocale?: 'cs' | 'en' | null;
  }): Promise<UserSettings> {
    const response = await api.patch('/users/me/settings', settings);
    return response.data;
  },
};

