import { config } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { offlineSync, isSyncablePath } from './offlineSync';

const BASE = config.apiBaseUrl;
const CACHE_PREFIX = 'api_cache:';
const DEFAULT_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'x-api-version': '1',
  'X-App': 'mobile',
};

export interface ApiError extends Error {
  status?: number;
  data?: unknown;
}

/** Error thrown when a mutation was queued for offline sync (network error). */
export class OfflineQueuedError extends Error {
  constructor() {
    super('Uloženo lokálně. Po obnovení připojení se synchronizuje.');
    this.name = 'OfflineQueuedError';
  }
}

function isAbortError(e: unknown): boolean {
  return e != null && typeof e === 'object' && (e as { name?: string }).name === 'AbortError';
}

function isNetworkError(e: unknown): boolean {
  if (e instanceof TypeError && e.message?.includes('Network')) return true;
  if (isAbortError(e)) return true;
  return false;
}

function normalizePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

function getCacheKey(path: string): string {
  return CACHE_PREFIX + normalizePath(path);
}

function shouldCachePath(path: string): boolean {
  const normalized = normalizePath(path);
  if (normalized.startsWith('/auth')) return false;
  return true;
}

async function saveGetCache(path: string, data: unknown): Promise<void> {
  if (!shouldCachePath(path)) return;
  try {
    await AsyncStorage.setItem(getCacheKey(path), JSON.stringify(data));
  } catch {
    // ignore cache write errors
  }
}

async function loadGetCache<T>(path: string): Promise<T | null> {
  if (!shouldCachePath(path)) return null;
  try {
    const raw = await AsyncStorage.getItem(getCacheKey(path));
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

type RequestOptions = RequestInit & { token?: string | null };

async function coreRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, ...init } = options;
  const headers: Record<string, string> = { ...DEFAULT_HEADERS };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 30_000);

  const url = `${BASE}${path}`;
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log('[API]', init.method ?? 'GET', url);
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      cache: 'no-store', // prevent HTTP cache so mutations (e.g. add beer) show immediately
      headers: { ...headers, ...(init.headers as Record<string, string>) },
      signal: ctrl.signal,
    });
  } catch (e) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[API] Network error:', url, e);
    }
    throw e;
  }
  clearTimeout(t);

  const data = (await res.json().catch(() => ({}))) as T & { message?: string };

  if (!res.ok) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[API] Error response:', res.status, url, data);
    }
    const err = new Error((data as { message?: string }).message ?? 'Request failed') as ApiError;
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

async function request<T>(
  path: string,
  options: RequestOptions & { method?: string; body?: string } = {},
  skipOfflineQueue = false
): Promise<T> {
  const method = options.method ?? 'GET';
  try {
    const data = await coreRequest<T>(path, options);
    if (method === 'GET') {
      await saveGetCache(path, data);
    }
    return data;
  } catch (e) {
    if (method === 'GET' && isNetworkError(e)) {
      const cached = await loadGetCache<T>(path);
      if (cached !== null) return cached;
    }
    if (
      !skipOfflineQueue &&
      isNetworkError(e) &&
      method !== 'GET' &&
      isSyncablePath(path)
    ) {
      try {
        const body = options.body ? (JSON.parse(options.body) as unknown) : undefined;
        await offlineSync.enqueue(method, path, body);
        throw new OfflineQueuedError();
      } catch (enqueueErr) {
        if (enqueueErr instanceof OfflineQueuedError) throw enqueueErr;
        throw e;
      }
    }
    throw e;
  }
}

export const api = {
  async get<T>(path: string, token?: string | null): Promise<T> {
    return request<T>(path, { method: 'GET', token });
  },

  async post<T>(path: string, body: unknown, token?: string | null): Promise<T> {
    return request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
      token,
    });
  },

  async put<T>(path: string, body: unknown, token?: string | null): Promise<T> {
    return request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
      token,
    });
  },

  async patch<T>(path: string, body: unknown, token?: string | null): Promise<T> {
    return request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
      token,
    });
  },

  async delete<T>(path: string, token?: string | null): Promise<T> {
    return request<T>(path, { method: 'DELETE', token });
  },

  /**
   * Execute a request without queueing on network error. Used by offline sync
   * when replaying the queue so we don't re-queue failed replays.
   */
  async requestForSync(
    method: string,
    path: string,
    body: unknown,
    token: string | null
  ): Promise<unknown> {
    const bodyStr = body !== undefined && body !== null ? JSON.stringify(body) : undefined;
    return coreRequest(path, {
      method,
      body: bodyStr,
      token,
    });
  },
};
