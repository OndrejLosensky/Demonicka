import { create } from 'zustand';
import type { Event } from '@demonicka/shared-types';
import { api } from '../services/api';
import { useAuthStore } from './auth.store';

interface EventState {
  activeEvent: Event | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchActiveEvent: () => Promise<void>;
  clearActiveEvent: () => void;
}

export const useEventStore = create<EventState>((set) => ({
  activeEvent: null,
  isLoading: false,
  error: null,

  fetchActiveEvent: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    set({ isLoading: true, error: null });

    try {
      const event = await api.get<Event>('/events/active', token);
      set({ activeEvent: event, isLoading: false });
    } catch (e: unknown) {
      const err = e as { message?: string; status?: number };
      // 404 means no active event, which is valid
      if (err?.status === 404) {
        set({ activeEvent: null, isLoading: false });
      } else {
        set({
          error: err?.message ?? 'Failed to fetch active event',
          isLoading: false,
        });
      }
    }
  },

  clearActiveEvent: () => set({ activeEvent: null, error: null }),
}));
