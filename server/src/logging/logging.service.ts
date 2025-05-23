import { Injectable } from '@nestjs/common';
import * as winston from 'winston';
import { format } from 'winston';
import * as fs from 'fs/promises';
import * as path from 'path';
import 'winston-daily-rotate-file';
import type { DailyRotateFileTransportOptions } from 'winston-daily-rotate-file';

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  service: string;
  event?: string;
  [key: string]: any;
}

@Injectable()
export class LoggingService {
  private logger: winston.Logger;
  private readonly logDir = 'logs';
  private readonly combinedLogPath = path.join(this.logDir, 'combined.log');

  constructor() {
    // Ensure logs directory exists
    fs.mkdir(this.logDir, { recursive: true }).catch(() => {});

    const rotateFileTransport = new winston.transports.DailyRotateFile({
      filename: path.join(this.logDir, '%DATE%-combined.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: format.combine(format.timestamp(), format.json()),
    }) as winston.transport;

    const errorRotateFileTransport = new winston.transports.DailyRotateFile({
      filename: path.join(this.logDir, '%DATE%-error.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error',
      format: format.combine(
        format.timestamp(),
        format.json()
      )
    });

    this.logger = winston.createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
      ),
      defaultMeta: { service: 'beer-app' },
      transports: [
        rotateFileTransport,
        errorRotateFileTransport
      ],
    });

    // If we're not in production, log to the console with colors
    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(
        new winston.transports.Console({
          format: format.combine(
            format.colorize(),
            format.simple(),
            format.printf(({ timestamp, level, message, ...meta }) => {
              const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
              return `${timestamp} [${level}]: ${message} ${metaStr}`;
            }),
          ),
        }),
      );
    }
  }

  async getLogs(
    level?: string,
    limit = 100,
    offset = 0,
    startDate?: Date,
    endDate?: Date,
    eventType?: string,
  ): Promise<{ logs: LogEntry[]; total: number }> {
    try {
      const fileContent = await fs.readFile(this.combinedLogPath, 'utf-8');
      let logs = fileContent
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line) as LogEntry)
        .sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

      if (level) {
        logs = logs.filter((log) => log.level === level);
      }

      if (startDate) {
        logs = logs.filter((log) => new Date(log.timestamp) >= startDate);
      }

      if (endDate) {
        logs = logs.filter((log) => new Date(log.timestamp) <= endDate);
      }

      if (eventType) {
        logs = logs.filter((log) => log.event === eventType);
      }

      const total = logs.length;
      logs = logs.slice(offset, offset + limit);

      return { logs, total };
    } catch (error) {
      if (error instanceof Error && error.message.includes('ENOENT')) {
        return { logs: [], total: 0 };
      }
      throw error;
    }
  }

  async getLogStats(startDate?: Date, endDate?: Date): Promise<{
    totalLogs: number;
    errorCount: number;
    warnCount: number;
    eventCounts: Record<string, number>;
    participantActivity: Record<string, number>;
    barrelActivity: Record<string, number>;
  }> {
    try {
      const { logs } = await this.getLogs(
        undefined,
        Number.MAX_SAFE_INTEGER,
        0,
        startDate,
        endDate
      );

      const stats = {
        totalLogs: logs.length,
        errorCount: logs.filter(log => log.level === 'error').length,
        warnCount: logs.filter(log => log.level === 'warn').length,
        eventCounts: {},
        participantActivity: {},
        barrelActivity: {},
      };

      logs.forEach(log => {
        if (log.event) {
          stats.eventCounts[log.event] = (stats.eventCounts[log.event] || 0) + 1;
        }
        if (log.participantId) {
          stats.participantActivity[log.participantId] = (stats.participantActivity[log.participantId] || 0) + 1;
        }
        if (log.barrelId) {
          stats.barrelActivity[log.barrelId] = (stats.barrelActivity[log.barrelId] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      this.error('Failed to get log statistics', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  error(message: string, meta?: Record<string, unknown>) {
    this.logger.error(message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.logger.warn(message, meta);
  }

  info(message: string, meta?: Record<string, unknown>) {
    this.logger.info(message, meta);
  }

  debug(message: string, meta?: Record<string, unknown>) {
    this.logger.debug(message, meta);
  }

  logBeerAdded(participantId: string, barrelId?: string | null) {
    this.info('Beer added to participant', {
      event: 'BEER_ADDED',
      participantId,
      barrelId,
    });
  }

  logBeerRemoved(participantId: string, barrelId?: string | null) {
    this.info('Beer removed from participant', {
      event: 'BEER_REMOVED',
      participantId,
      barrelId,
    });
  }

  logBarrelCreated(barrelId: string, size: number) {
    this.info('New barrel created', {
      event: 'BARREL_CREATED',
      barrelId,
      size,
    });
  }

  logBarrelDeleted(barrelId: string) {
    this.info('Barrel deleted', {
      event: 'BARREL_DELETED',
      barrelId,
    });
  }

  logBarrelUpdated(barrelId: string, changes: Record<string, any>) {
    this.info('Barrel updated', {
      event: 'BARREL_UPDATED',
      barrelId,
      changes,
    });
  }

  logBarrelStatusChanged(barrelId: string, isActive: boolean) {
    this.info('Barrel status changed', {
      event: 'BARREL_STATUS_CHANGED',
      barrelId,
      isActive,
    });
  }

  logBarrelEmpty(barrelId: string) {
    this.info('Barrel is now empty', {
      event: 'BARREL_EMPTY',
      barrelId,
    });
  }

  logParticipantCreated(
    participantId: string,
    name: string,
    gender: string,
  ) {
    this.info('New participant created', {
      event: 'PARTICIPANT_CREATED',
      participantId,
      name,
      gender,
    });
  }

  logParticipantUpdated(participantId: string, changes: Record<string, any>) {
    this.info('Participant updated', {
      event: 'PARTICIPANT_UPDATED',
      participantId,
      changes,
    });
  }

  logParticipantDeleted(participantId: string) {
    this.info('Participant deleted', {
      event: 'PARTICIPANT_DELETED',
      participantId,
    });
  }

  logParticipantBeerCountUpdated(
    participantId: string,
    oldCount: number,
    newCount: number,
  ) {
    this.info('Participant beer count updated', {
      event: 'PARTICIPANT_BEER_COUNT_UPDATED',
      participantId,
      oldCount,
      newCount,
      change: newCount - oldCount,
    });
  }

  logCleanup(
    type: 'BARRELS' | 'PARTICIPANTS' | 'ALL',
    details?: Record<string, any>,
  ) {
    this.info('Cleanup performed', {
      event: 'CLEANUP',
      type,
      ...details,
    });
  }
} 