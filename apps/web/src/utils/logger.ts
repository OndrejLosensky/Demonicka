/**
 * Global logger for the web app.
 * Sends log entries to the backend POST /api/logs/ingest in canonical format.
 * Fire-and-forget so UI never blocks; in dev also logs to console.
 */

import { config } from '../config/index';
import { api } from '../services/api';

const APP = 'web' as const;
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

function send(payload: Record<string, unknown>): void {
  if (config.isDev) {
    console.log('[logger]', payload.message, payload);
  }
  void api
    .post('/logs/ingest', payload, {
      headers: { 'X-App': APP },
      timeout: 5000,
    })
    .catch(() => {
      if (config.isDev) {
        console.warn('[logger] Failed to send log to backend', payload);
      }
    });
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
