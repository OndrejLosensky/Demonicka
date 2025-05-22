import { Injectable } from '@nestjs/common';
import * as winston from 'winston';
import { format } from 'winston';
import * as fs from 'fs/promises';
import * as path from 'path';

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

    this.logger = winston.createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json(),
      ),
      defaultMeta: { service: 'beer-app' },
      transports: [
        new winston.transports.File({
          filename: this.combinedLogPath,
          format: format.combine(
            format.timestamp(),
            format.json(),
          ),
        }),
        new winston.transports.File({
          filename: path.join(this.logDir, 'error.log'),
          level: 'error',
          format: format.combine(
            format.timestamp(),
            format.json(),
          ),
        }),
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
              return `${timestamp} [${level}]: ${message} ${
                Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
              }`;
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
  ): Promise<{ logs: LogEntry[]; total: number }> {
    try {
      const fileContent = await fs.readFile(this.combinedLogPath, 'utf-8');
      let logs = fileContent
        .split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line) as LogEntry)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      if (level) {
        logs = logs.filter(log => log.level === level);
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

  // Log methods for different levels
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

  // Specific business event logging methods
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

  logParticipantCreated(participantId: string, name: string) {
    this.info('New participant created', {
      event: 'PARTICIPANT_CREATED',
      participantId,
      name,
    });
  }

  logParticipantDeleted(participantId: string) {
    this.info('Participant deleted', {
      event: 'PARTICIPANT_DELETED',
      participantId,
    });
  }

  logCleanup(type: 'BARRELS' | 'PARTICIPANTS' | 'ALL') {
    this.info('Cleanup performed', {
      event: 'CLEANUP',
      type,
    });
  }
} 