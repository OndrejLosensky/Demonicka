import { config } from '../config';

const BASE = config.apiBaseUrl;
const DEFAULT_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'x-api-version': '1',
};

export interface ApiError extends Error {
  status?: number;
  data?: unknown;
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
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

export const api = {
  async get<T>(path: string, token?: string | null): Promise<T> {
    return request<T>(path, { method: 'GET', token });
  },

  async post<T>(path: string, body: unknown, token?: string | null): Promise<T> {
    return request<T>(path, { method: 'POST', body: JSON.stringify(body), token });
  },

  async put<T>(path: string, body: unknown, token?: string | null): Promise<T> {
    return request<T>(path, { method: 'PUT', body: JSON.stringify(body), token });
  },

  async patch<T>(path: string, body: unknown, token?: string | null): Promise<T> {
    return request<T>(path, { method: 'PATCH', body: JSON.stringify(body), token });
  },

  async delete<T>(path: string, token?: string | null): Promise<T> {
    return request<T>(path, { method: 'DELETE', token });
  },
};
