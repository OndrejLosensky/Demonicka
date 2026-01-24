import { create } from 'zustand';
import type { User } from '@demonicka/shared-types';
import { authService, type LoginResult } from '../services/auth.service';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const result = await authService.login(username, password);

      if ('requiresTwoFactor' in result && result.requiresTwoFactor) {
        set({ isLoading: false });
        return result;
      }

      // Type guard passed - result is LoginSuccess
      const successResult = result as { access_token: string; user: User };

      set({
        user: successResult.user,
        token: successResult.access_token,
        isAuthenticated: true,
        isLoading: false,
      });

      return result;
    } catch (e: unknown) {
      const err = e as { message?: string; data?: { message?: string } };
      const message = err?.data?.message ?? err?.message ?? 'Login failed';
      set({ error: message, isLoading: false });
      throw e;
    }
  },

  logout: async () => {
    await authService.logout();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  bootstrap: async () => {
    set({ isLoading: true });

    try {
      const token = await authService.getStoredToken();

      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      const user = await authService.fetchMe(token);

      if (user) {
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
