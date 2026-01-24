import * as SecureStore from 'expo-secure-store';
import { api } from './api';
import type { User } from '@demonicka/shared-types';

const TOKEN_KEY = 'access_token';

export interface LoginSuccess {
  access_token: string;
  user: User;
}

export interface LoginRequires2FA {
  requiresTwoFactor: true;
  message: string;
}

export type LoginResult = LoginSuccess | LoginRequires2FA;

export const authService = {
  async getStoredToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setStoredToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },

  async clearStoredToken(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },

  async login(username: string, password: string): Promise<LoginResult> {
    const data = await api.post<LoginSuccess | LoginRequires2FA>('/auth/login', {
      username,
      password,
    });

    if ('requiresTwoFactor' in data && data.requiresTwoFactor) {
      return { requiresTwoFactor: true, message: data.message ?? '' };
    }

    const success = data as LoginSuccess;
    await this.setStoredToken(success.access_token);
    return success;
  },

  async fetchMe(token: string): Promise<User | null> {
    try {
      const user = await api.get<User>('/auth/me', token);
      return user ?? null;
    } catch (e: unknown) {
      const err = e as { status?: number };
      if (err?.status === 401) {
        await this.clearStoredToken();
      }
      return null;
    }
  },

  async logout(): Promise<void> {
    await this.clearStoredToken();
  },
};
