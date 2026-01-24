import { config } from '../config';

const BASE = config.apiBaseUrl;
const DEFAULT_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'x-api-version': '1',
};

async function request<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token, ...init } = options;
  const headers: Record<string, string> = { ...DEFAULT_HEADERS };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 30_000);
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers as Record<string, string>) },
    signal: ctrl.signal,
  });
  clearTimeout(t);
  const data = (await res.json().catch(() => ({}))) as T & { message?: string };
  if (!res.ok) {
    const err = new Error((data as { message?: string }).message ?? 'Request failed') as Error & {
      status?: number;
      data?: unknown;
    };
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  async post<T>(path: string, body: unknown, token?: string | null): Promise<T> {
    return request<T>(path, { method: 'POST', body: JSON.stringify(body), token });
  },
  async get<T>(path: string, token?: string | null): Promise<T> {
    return request<T>(path, { method: 'GET', token }) as Promise<T>;
  },
};
