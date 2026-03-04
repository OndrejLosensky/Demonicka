/**
 * Global logger for the mobile app.
 * Sends log entries to the backend POST /api/logs/ingest in canonical format.
 * Fire-and-forget; when online uses auth token from SecureStore. In dev also logs to console.
 */

import { config } from '../config';
import { api } from '../services/api';
import { authService } from '../services/auth.service';

const APP = 'mobile' as const;
const LEVELS = ['ERROR', 'WARN', 'INFO', 'DEBUG'] as const;
type Level = (typeof LEVELS)[number];

export interface LogMeta {
  event?: string;
  actorUserId?: string;
  [key: string]: unknown;
}

function buildPayload(level: Level, message: string, meta?: LogMeta): Record<string, unknown> {
  return {
    timestamp: new Date().toISOString(),
    app: APP,
    level,
    message,
    ...meta,
  };
}

async function sendAsync(payload: Record<string, unknown>): Promise<void> {
  try {
    const token = await authService.getStoredToken();
    await api.post('/logs/ingest', payload, token);
  } catch {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[logger] Failed to send log to backend', payload);
    }
  }
}

function send(payload: Record<string, unknown>): void {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log('[logger]', payload.message, payload);
  }
  void sendAsync(payload);
}

export const logger = {
  info(message: string, meta?: LogMeta): void {
    send(buildPayload('INFO', message, meta));
  },

  warn(message: string, meta?: LogMeta): void {
    send(buildPayload('WARN', message, meta));
  },

  error(message: string, meta?: LogMeta): void {
    send(buildPayload('ERROR', message, meta));
  },

  debug(message: string, meta?: LogMeta): void {
    send(buildPayload('DEBUG', message, meta));
  },
};
