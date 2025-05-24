import { Injectable } from '@nestjs/common';
import * as winston from 'winston';
import { format } from 'winston';
import * as fs from 'fs/promises';
import * as path from 'path';
import 'winston-daily-rotate-file';
import type { Stats } from 'fs';
import type { DailyRotateFileTransportOptions } from 'winston-daily-rotate-file';

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  service: string;
  event?: string;
  participantId?: string;
  barrelId?: string;
  [key: string]: unknown;
}

interface CleanupOptions {
  olderThan?: Date;
  levels?: string[];
  eventTypes?: string[];
}

/**
 * Service responsible for application-wide logging functionality.
 * Handles log creation, rotation, and querying across different log levels.
 * Supports both file-based and console logging with different formats for development and production.
 */
@Injectable()
export class LoggingService {
  private logger: winston.Logger;
  private readonly logDir = 'logs';
  private readonly combinedLogPath = path.join(this.logDir, 'combined.log');

  constructor() {
    // Ensure logs directory exists
    fs.mkdir(this.logDir, { recursive: true }).catch(() => {});

    // Configure daily rotating log file for all log levels
    const rotateConfig: DailyRotateFileTransportOptions = {
      filename: path.join(this.logDir, '%DATE%-combined.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: format.combine(format.timestamp(), format.json()),
    };

    // Configure daily rotating log file specifically for errors
    const errorRotateConfig: DailyRotateFileTransportOptions = {
      filename: path.join(this.logDir, '%DATE%-error.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error',
      format: format.combine(format.timestamp(), format.json()),
    };

    const rotateFileTransport = new winston.transports.DailyRotateFile(rotateConfig);
    const errorRotateFileTransport = new winston.transports.DailyRotateFile(errorRotateConfig);

    // Initialize winston logger with file transports
    this.logger = winston.createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json(),
      ),
      defaultMeta: { service: 'beer-app' },
      transports: [rotateFileTransport, errorRotateFileTransport],
    });

    // Add console transport for development environment
    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(
        new winston.transports.Console({
          format: format.combine(
            format.colorize(),
            format.simple(),
            format.printf(({ timestamp, level, message, ...meta }) => {
              const safeTimestamp = String(timestamp);
              const safeLevel = String(level);
              const safeMessage = String(message);
              const metaStr = Object.keys(meta).length
                ? JSON.stringify(meta, null, 2)
                : '';
              return `${safeTimestamp} [${safeLevel}]: ${safeMessage} ${metaStr}`;
            }),
          ),
        }),
      );
    }
  }

  /**
   * Retrieves logs based on specified filters
   * @param level - Log level to filter by
   * @param limit - Maximum number of logs to return
   * @param offset - Number of logs to skip
   * @param startDate - Start date for log range
   * @param endDate - End date for log range
   * @param eventType - Specific event type to filter by
   */
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
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
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

  /**
   * Gets statistics about logged events within a date range
   * @param startDate - Start date for statistics calculation
   * @param endDate - End date for statistics calculation
   */
  async getLogStats(
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
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
        endDate,
      );

      const stats = {
        totalLogs: logs.length,
        errorCount: logs.filter((log) => log.level === 'error').length,
        warnCount: logs.filter((log) => log.level === 'warn').length,
        eventCounts: {} as Record<string, number>,
        participantActivity: {} as Record<string, number>,
        barrelActivity: {} as Record<string, number>,
      };

      logs.forEach((log: LogEntry) => {
        if (log.event) {
          const event = String(log.event);
          stats.eventCounts[event] = (stats.eventCounts[event] || 0) + 1;
        }

        if (log.participantId) {
          const id = String(log.participantId);
          stats.participantActivity[id] = (stats.participantActivity[id] || 0) + 1;
        }

        if (log.barrelId) {
          const id = String(log.barrelId);
          stats.barrelActivity[id] = (stats.barrelActivity[id] || 0) + 1;
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

  /**
   * Logs an error message with optional metadata
   * @param message - Error message to log
   * @param meta - Additional metadata to include in the log
   */
  error(message: string, meta?: Record<string, unknown>) {
    this.logger.error(message, meta);
  }

  /**
   * Logs a warning message with optional metadata
   * @param message - Warning message to log
   * @param meta - Additional metadata to include in the log
   */
  warn(message: string, meta?: Record<string, unknown>) {
    this.logger.warn(message, meta);
  }

  /**
   * Logs an info message with optional metadata
   * @param message - Info message to log
   * @param meta - Additional metadata to include in the log
   */
  info(message: string, meta?: Record<string, unknown>) {
    this.logger.info(message, meta);
  }

  /**
   * Logs a debug message with optional metadata
   * @param message - Debug message to log
   * @param meta - Additional metadata to include in the log
   */
  debug(message: string, meta?: Record<string, unknown>) {
    this.logger.debug(message, meta);
  }

  /**
   * Logs a beer addition event
   * @param participantId - ID of the participant who received the beer
   * @param barrelId - Optional ID of the barrel the beer came from
   */
  logBeerAdded(participantId: string, barrelId?: string | null) {
    this.info('Beer added to participant', {
      event: 'BEER_ADDED',
      participantId,
      barrelId,
    });
  }

  /**
   * Logs a beer removal event
   * @param participantId - ID of the participant who had beer removed
   * @param barrelId - Optional ID of the barrel the beer was associated with
   */
  logBeerRemoved(participantId: string, barrelId?: string | null) {
    this.info('Beer removed from participant', {
      event: 'BEER_REMOVED',
      participantId,
      barrelId,
    });
  }

  /**
   * Logs a barrel creation event
   * @param barrelId - ID of the newly created barrel
   * @param size - Size of the barrel
   */
  logBarrelCreated(barrelId: string, size: number) {
    this.info('New barrel created', {
      event: 'BARREL_CREATED',
      barrelId,
      size,
    });
  }

  /**
   * Logs a barrel deletion event
   * @param barrelId - ID of the deleted barrel
   */
  logBarrelDeleted(barrelId: string) {
    this.info('Barrel deleted', {
      event: 'BARREL_DELETED',
      barrelId,
    });
  }

  /**
   * Logs a barrel update event
   * @param barrelId - ID of the updated barrel
   * @param changes - Object containing the changes made to the barrel
   */
  logBarrelUpdated(barrelId: string, changes: Record<string, any>) {
    this.info('Barrel updated', {
      event: 'BARREL_UPDATED',
      barrelId,
      changes,
    });
  }

  /**
   * Logs a barrel status change event
   * @param barrelId - ID of the barrel
   * @param isActive - New active status of the barrel
   */
  logBarrelStatusChanged(barrelId: string, isActive: boolean) {
    this.info('Barrel status changed', {
      event: 'BARREL_STATUS_CHANGED',
      barrelId,
      isActive,
    });
  }

  /**
   * Logs when a barrel becomes empty
   * @param barrelId - ID of the empty barrel
   */
  logBarrelEmpty(barrelId: string) {
    this.info('Barrel is now empty', {
      event: 'BARREL_EMPTY',
      barrelId,
    });
  }

  /**
   * Logs a participant creation event
   * @param participantId - ID of the new participant
   * @param name - Name of the participant
   * @param gender - Gender of the participant
   */
  logParticipantCreated(participantId: string, name: string, gender: string) {
    this.info('New participant created', {
      event: 'PARTICIPANT_CREATED',
      participantId,
      name,
      gender,
    });
  }

  /**
   * Logs a participant update event
   * @param participantId - ID of the updated participant
   * @param changes - Object containing the changes made to the participant
   */
  logParticipantUpdated(participantId: string, changes: Record<string, any>) {
    this.info('Participant updated', {
      event: 'PARTICIPANT_UPDATED',
      participantId,
      changes,
    });
  }

  /**
   * Logs a participant deletion event
   * @param participantId - ID of the deleted participant
   */
  logParticipantDeleted(participantId: string) {
    this.info('Participant deleted', {
      event: 'PARTICIPANT_DELETED',
      participantId,
    });
  }

  /**
   * Logs a change in participant's beer count
   * @param participantId - ID of the participant
   * @param oldCount - Previous beer count
   * @param newCount - New beer count
   */
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

  /**
   * Logs a cleanup operation
   * @param type - Type of cleanup performed
   * @param details - Additional details about the cleanup
   */
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

  /**
   * Performs cleanup of log files based on specified options
   * @param options - Cleanup configuration options
   */
  async cleanup(
    options: CleanupOptions = {},
  ): Promise<{ deletedCount: number }> {
    try {
      const logFiles = await fs.readdir(this.logDir);
      let deletedCount = 0;

      for (const file of logFiles) {
        if (!file.endsWith('.log')) continue;

        const filePath = path.join(this.logDir, file);
        const stats = await fs.stat(filePath);
        const shouldDelete = this.shouldDeleteFile(file, stats, options);

        if (shouldDelete) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }

      // Ensure log directory exists after cleanup
      await fs.mkdir(this.logDir, { recursive: true });

      // Close existing transports
      await Promise.all(
        this.logger.transports.map((t) => 
          new Promise((resolve) => t.on('finish', resolve))
        )
      );
      this.logger.clear();

      // Reinitialize transports
      const rotateConfig: DailyRotateFileTransportOptions = {
        filename: path.join(this.logDir, '%DATE%-combined.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format: format.combine(format.timestamp(), format.json()),
      };

      const errorRotateConfig: DailyRotateFileTransportOptions = {
        filename: path.join(this.logDir, '%DATE%-error.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        level: 'error',
        format: format.combine(format.timestamp(), format.json()),
      };

      const rotateFileTransport = new winston.transports.DailyRotateFile(rotateConfig);
      const errorRotateFileTransport = new winston.transports.DailyRotateFile(errorRotateConfig);

      this.logger.add(rotateFileTransport);
      this.logger.add(errorRotateFileTransport);

      // Add console transport back if in development
      if (process.env.NODE_ENV !== 'production') {
        this.logger.add(
          new winston.transports.Console({
            format: format.combine(
              format.colorize(),
              format.simple(),
              format.printf(({ timestamp, level, message, ...meta }) => {
                const safeTimestamp = String(timestamp);
                const safeLevel = String(level);
                const safeMessage = String(message);
                const metaStr = Object.keys(meta).length
                  ? JSON.stringify(meta, null, 2)
                  : '';
                return `${safeTimestamp} [${safeLevel}]: ${safeMessage} ${metaStr}`;
              }),
            ),
          }),
        );
      }

      // Log the cleanup operation
      this.info('Logs cleanup performed', {
        event: 'CLEANUP',
        type: 'LOGS',
        deletedCount,
        options,
      });

      return { deletedCount };
    } catch (error) {
      this.error('Failed to cleanup logs', {
        error: error instanceof Error ? error.message : String(error),
        options,
      });
      throw error;
    }
  }

  /**
   * Determines if a log file should be deleted based on cleanup options
   * @param fileName - Name of the log file
   * @param stats - File statistics
   * @param options - Cleanup configuration options
   */
  private shouldDeleteFile(
    fileName: string,
    stats: Stats,
    options: CleanupOptions,
  ): boolean {
    // If olderThan is specified, check file age
    if (options.olderThan && stats.mtime > options.olderThan) {
      return false;
    }

    // If no other filters are specified, we can delete the file
    if (!options.levels?.length && !options.eventTypes?.length) {
      return true;
    }

    // For more specific filtering, we need to check file contents
    // This is a simple implementation - in production, you might want to use
    // more efficient methods like indexing or metadata storage
    return true;
  }
}
