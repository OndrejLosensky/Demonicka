import * as Updates from 'expo-updates';

export interface CheckResult {
  isAvailable: boolean;
  error?: string;
}

export interface FetchAndReloadResult {
  success: boolean;
  error?: string;
}

function isUpdatesEnabled(): boolean {
  try {
    return Updates.isEnabled;
  } catch {
    return false;
  }
}

/**
 * Hook for Expo Updates: check for OTA updates and fetch/reload.
 * All methods no-op when Updates.isEnabled is false (e.g. dev, Expo Go).
 */
export function useExpoUpdates() {
  const checkForUpdate = async (): Promise<CheckResult> => {
    if (!isUpdatesEnabled()) {
      return { isAvailable: false };
    }
    try {
      const result = await Updates.checkForUpdateAsync();
      return { isAvailable: result.isAvailable };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { isAvailable: false, error: message };
    }
  };

  const fetchAndReload = async (): Promise<FetchAndReloadResult> => {
    if (!isUpdatesEnabled()) {
      return { success: false, error: 'Updates are not enabled' };
    }
    try {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, error: message };
    }
  };

  return {
    isEnabled: isUpdatesEnabled(),
    checkForUpdate,
    fetchAndReload,
  };
}
