import * as SecureStore from 'expo-secure-store';
import { api } from './api';
import { config } from '../config';
import type { User } from '@demonicka/shared-types';

const TOKEN_KEY = 'access_token';

const LOGIN_URL = `${config.apiBaseUrl}/auth/login`;

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
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[Auth] Login request to', LOGIN_URL);
    }
    try {
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
    } catch (e: unknown) {
      const err = e as { status?: number; message?: string; data?: unknown };
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.warn('[Auth] Login failed:', err.status, err.message, err.data);
      }
      throw e;
    }
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

  async getUsernameFromToken(token: string): Promise<{ username: string }> {
    const data = await api.get<{ username: string }>(`/users/token/${encodeURIComponent(token)}/username`);
    return data;
  },

  async completeRegistration(
    registrationToken: string,
    username: string,
    password: string
  ): Promise<LoginSuccess> {
    const data = await api.post<LoginSuccess>('/auth/complete-registration', {
      registrationToken: registrationToken.trim(),
      username: username.trim(),
      password,
    });
    await this.setStoredToken(data.access_token);
    return data;
  },
};
