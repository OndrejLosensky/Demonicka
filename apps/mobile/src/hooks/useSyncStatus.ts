import { useEffect, useState, useCallback } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { offlineSync, isProcessing } from '../services/offlineSync';
import { api } from '../services/api';
import { useAuthStore } from '../store/auth.store';

export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'offline';

export function useSyncStatus(): {
  queueLength: number;
  isProcessing: boolean;
  status: SyncStatus;
  statusLabel: string;
  runSync: () => Promise<void>;
} {
  const token = useAuthStore((state) => state.token);
  const [queueLength, setQueueLength] = useState(offlineSync.getQueueLength());
  const [processing, setProcessingState] = useState(isProcessing());

  const runSync = useCallback(async () => {
    if (!token) return;
    const executor = async (item: { method: string; path: string; body?: unknown }) => {
      await api.requestForSync(item.method, item.path, item.body, token);
    };
    await offlineSync.processQueue(token, executor);
    setQueueLength(offlineSync.getQueueLength());
    setProcessingState(isProcessing());
  }, [token]);

  useEffect(() => {
    offlineSync.refreshQueueLength().then(() => {
      setQueueLength(offlineSync.getQueueLength());
    });
  }, []);

  useEffect(() => {
    const unsub = offlineSync.subscribe(() => {
      setQueueLength(offlineSync.getQueueLength());
      setProcessingState(isProcessing());
    });
    return unsub;
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        runSync();
      }
    });
    return () => sub.remove();
  }, [runSync]);

  // Run sync when token becomes available (e.g. after login)
  useEffect(() => {
    if (token) {
      runSync();
    }
  }, [token, runSync]);

  const isSyncing = processing;
  const status: SyncStatus =
    isSyncing ? 'syncing' : queueLength > 0 ? 'pending' : 'synced';
  const statusLabel =
    status === 'synced'
      ? 'Synced'
      : status === 'syncing'
        ? 'Syncing…'
        : `${queueLength} pending`;

  return {
    queueLength,
    isProcessing: isSyncing,
    status,
    statusLabel,
    runSync,
  };
}
