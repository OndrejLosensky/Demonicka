import { api } from './api';

export type UserSettings = {
  preferredTheme: 'light' | 'dark' | null;
};

export const userSettingsService = {
  async getMySettings(): Promise<UserSettings> {
    const response = await api.get('/users/me/settings');
    return response.data;
  },

  async updateMySettings(preferredTheme: 'light' | 'dark' | null): Promise<UserSettings> {
    const response = await api.patch('/users/me/settings', { preferredTheme });
    return response.data;
  },
};

