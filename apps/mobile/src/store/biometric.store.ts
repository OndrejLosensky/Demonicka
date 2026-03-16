import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const BIOMETRIC_DECIDED_KEY = 'biometric_decided';

interface BiometricState {
  available: boolean;
  enabled: boolean;
  hasDecided: boolean;

  setAvailable: (available: boolean) => void;
  syncFromStorage: () => Promise<void>;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
  markDecided: () => Promise<void>;
}

export const useBiometricStore = create<BiometricState>((set, get) => ({
  available: false,
  enabled: false,
  hasDecided: false,

  setAvailable(available) {
    set({ available });
    if (!available && get().enabled) {
      set({ enabled: false });
      void SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
    }
  },

  async syncFromStorage() {
    try {
      const [enabledRaw, decidedRaw] = await Promise.all([
        SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY),
        SecureStore.getItemAsync(BIOMETRIC_DECIDED_KEY),
      ]);
      set({
        enabled: enabledRaw === 'true',
        hasDecided: decidedRaw === 'true',
      });
    } catch {
      // Ignore storage errors; fall back to defaults.
    }
  },

  async enable() {
    set({ enabled: true });
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
  },

  async disable() {
    set({ enabled: false });
    await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
  },

  async markDecided() {
    set({ hasDecided: true });
    await SecureStore.setItemAsync(BIOMETRIC_DECIDED_KEY, 'true');
  },
}));

