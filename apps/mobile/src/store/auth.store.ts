import { create } from 'zustand';
import type { User } from '@demonicka/shared-types';
import { authService, type LoginResult } from '../services/auth.service';
import { logger } from '../utils/logger';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  login: (
    username: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<LoginResult>;
  completeRegistration: (
    registrationToken: string,
    username: string,
    password: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
  clearError: () => void;
  /** Set user from Google OAuth callback token (deep link). */
  setTokenFromGoogle: (token: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  login: async (
    username: string,
    password: string,
    rememberMe = true,
  ) => {
    set({ isLoading: true, error: null });

    try {
      const result = await authService.login(
        username,
        password,
        rememberMe,
      );

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

      logger.info('User logged in', {
        event: 'LOGIN',
        actorUserId: successResult.user.id,
        username: successResult.user.username,
      });

      return result;
    } catch (e: unknown) {
      const err = e as { message?: string; data?: { message?: string } };
      const message = err?.data?.message ?? err?.message ?? 'Login failed';
      set({ error: message, isLoading: false });
      throw e;
    }
  },

  completeRegistration: async (
    registrationToken: string,
    username: string,
    password: string
  ) => {
    set({ isLoading: true, error: null });

    try {
      const result = await authService.completeRegistration(
        registrationToken,
        username,
        password
      );

      set({
        user: result.user,
        token: result.access_token,
        isAuthenticated: true,
        isLoading: false,
      });

      logger.info('Registration completed', {
        event: 'REGISTRATION_COMPLETED',
        actorUserId: result.user.id,
        username: result.user.username,
      });
    } catch (e: unknown) {
      const err = e as { message?: string; data?: { message?: string } };
      const message = err?.data?.message ?? err?.message ?? 'Registrace se nezdařila';
      set({ error: message, isLoading: false });
      throw e;
    }
  },

  logout: async () => {
    const currentUser = get().user;
    await authService.logout();
    if (currentUser?.id) {
      logger.info('User logged out', {
        event: 'LOGOUT',
        actorUserId: currentUser.id,
        username: currentUser.username,
      });
    }
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

  setTokenFromGoogle: async (token: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.setTokenFromGoogleCallback(token);
      if (user) {
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });

        logger.info('User logged in via Google', {
          event: 'LOGIN_GOOGLE',
          actorUserId: user.id,
          username: user.username,
        });
      } else {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Přihlášení přes Google se nezdařilo',
        });
      }
    } catch {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Přihlášení přes Google se nezdařilo',
      });
    }
  },
}));
