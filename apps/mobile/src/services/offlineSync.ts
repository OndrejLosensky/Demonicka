import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'offline_sync_queue';
const MAX_LOG_ENTRIES = 50;

export interface OfflineQueueItem {
  id: string;
  method: string;
  path: string;
  body?: unknown;
  createdAt: number;
  retryCount?: number;
  lastError?: string;
}

export type SyncLogEntry = {
  id: string;
  kind: 'queued' | 'sync_start' | 'sync_item_ok' | 'sync_item_fail' | 'sync_done';
  at: number;
  method?: string;
  path?: string;
  message?: string;
  queueLength?: number;
};

type SyncExecutor = (item: OfflineQueueItem) => Promise<void>;

function isNetworkError(e: unknown): boolean {
  if (e instanceof TypeError && e.message?.includes('Network')) return true;
  if (e instanceof DOMException && e.name === 'AbortError') return true;
  return false;
}

function log(entry: Omit<SyncLogEntry, 'id' | 'at'>): void {
  const full: SyncLogEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    at: Date.now(),
  };
  logEntries.unshift(full);
  if (logEntries.length > MAX_LOG_ENTRIES) logEntries.pop();
  if (__DEV__) {
    const msg = `[OfflineSync] ${full.kind}${full.path ? ` ${full.method ?? ''} ${full.path}` : ''}${full.message ? ` - ${full.message}` : ''}${full.queueLength != null ? ` (queue: ${full.queueLength})` : ''}`;
    // eslint-disable-next-line no-console
    console.log(msg);
  }
}

const logEntries: SyncLogEntry[] = [];

// In-memory queue length and listeners for UI
let lastKnownQueueLength = 0;
const listeners = new Set<() => void>();
function notifyListeners(): void {
  listeners.forEach((f) => f());
}

async function loadQueue(): Promise<OfflineQueueItem[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) {
      lastKnownQueueLength = 0;
      return [];
    }
    const parsed = JSON.parse(raw) as OfflineQueueItem[];
    const queue = Array.isArray(parsed) ? parsed : [];
    lastKnownQueueLength = queue.length;
    return queue;
  } catch {
    lastKnownQueueLength = 0;
    return [];
  }
}

async function saveQueue(queue: OfflineQueueItem[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  lastKnownQueueLength = queue.length;
  notifyListeners();
}

/**
 * Whether a request path should be queued when it fails with a network error.
 * Excludes auth and other non-syncable endpoints.
 */
export function isSyncablePath(path: string): boolean {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (normalized.startsWith('/auth')) return false;
  return true;
}

export const offlineSync = {
  async getQueue(): Promise<OfflineQueueItem[]> {
    return loadQueue();
  },

  async enqueue(
    method: string,
    path: string,
    body?: unknown
  ): Promise<OfflineQueueItem> {
    if (!isSyncablePath(path)) {
      throw new Error(`Path not syncable for offline queue: ${path}`);
    }
    const item: OfflineQueueItem = {
      id: `offline-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      method,
      path,
      body,
      createdAt: Date.now(),
    };
    const queue = await loadQueue();
    queue.push(item);
    await saveQueue(queue);
    notifyListeners();
    log({
      kind: 'queued',
      method: item.method,
      path: item.path,
      queueLength: queue.length,
    });
    return item;
  },

  async clearQueue(): Promise<void> {
    await AsyncStorage.removeItem(QUEUE_KEY);
    lastKnownQueueLength = 0;
    notifyListeners();
    log({ kind: 'sync_done', message: 'Queue cleared' });
  },

  /**
   * Process the queue in order. Call with an executor that performs the request
   * without going through the normal API layer (to avoid re-queueing).
   * Uses current token from caller.
   */
  async processQueue(token: string | null, executor: SyncExecutor): Promise<void> {
    if (!token) return;
    const queue = await loadQueue();
    if (queue.length === 0) return;

    setProcessing(true);
    log({
      kind: 'sync_start',
      message: `Processing ${queue.length} item(s)`,
      queueLength: queue.length,
    });

    const remaining: OfflineQueueItem[] = [];
    try {
      for (const item of queue) {
        try {
          await executor(item);
          log({
            kind: 'sync_item_ok',
            method: item.method,
            path: item.path,
            queueLength: queue.length - 1,
          });
        } catch (e) {
          const retryCount = (item.retryCount ?? 0) + 1;
          const errMsg = e instanceof Error ? e.message : String(e);
          const isNetwork = isNetworkError(e);
          const isServerError =
            e &&
            typeof e === 'object' &&
            'status' in e &&
            typeof (e as { status?: number }).status === 'number' &&
            ((e as { status: number }).status >= 400);

          if (isNetwork || (isServerError && retryCount < 2)) {
            remaining.push({
              ...item,
              retryCount,
              lastError: errMsg,
            });
            log({
              kind: 'sync_item_fail',
              method: item.method,
              path: item.path,
              message: errMsg,
              queueLength: remaining.length,
            });
          } else {
            log({
              kind: 'sync_item_fail',
              method: item.method,
              path: item.path,
              message: `Giving up after retry: ${errMsg}`,
              queueLength: remaining.length,
            });
          }
        }
      }

      await saveQueue(remaining);
      log({
        kind: 'sync_done',
        message: remaining.length === 0 ? 'All synced' : `${remaining.length} pending`,
        queueLength: remaining.length,
      });
    } finally {
      setProcessing(false);
    }
  },

  getLogEntries(): SyncLogEntry[] {
    return [...logEntries];
  },

  getQueueLength(): number {
    return lastKnownQueueLength;
  },

  subscribe(callback: () => void): () => void {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },

  /** Load queue from storage and notify (e.g. on app start so UI shows correct count). */
  async refreshQueueLength(): Promise<void> {
    await loadQueue();
    notifyListeners();
  },
};

// Export for UI / sync status
let processing = false;
export function setProcessing(value: boolean): void {
  processing = value;
  notifyListeners();
}
export function isProcessing(): boolean {
  return processing;
}
