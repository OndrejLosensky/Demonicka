import { Injectable } from '@nestjs/common';
import * as winston from 'winston';
import { format } from 'winston';
import * as fs from 'fs/promises';
import * as path from 'path';
import 'winston-daily-rotate-file';
import type { Stats } from 'fs';
import type { DailyRotateFileTransportOptions } from 'winston-daily-rotate-file';
import { PrismaService } from '../prisma/prisma.service';

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  service: string;
  event?: string;
  userId?: string;
  actorUserId?: string;
  barrelId?: string;
  [key: string]: unknown;
}

export interface LogUserRef {
  id: string;
  username: string | null;
  name: string | null;
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

  constructor(private readonly prisma: PrismaService) {
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

    const rotateFileTransport = new winston.transports.DailyRotateFile(
      rotateConfig,
    );
    const errorRotateFileTransport = new winston.transports.DailyRotateFile(
      errorRotateConfig,
    );

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
    eventType?: string | string[],
    search?: string,
  ): Promise<{ logs: (LogEntry & { user?: LogUserRef; actor?: LogUserRef })[]; total: number }> {
    try {
      // Read all log files in the logs directory
      const files = await fs.readdir(this.logDir);
      const logFiles = files.filter(file => file.endsWith('-combined.log'));
      
      let allLogs: LogEntry[] = [];
      
      // Read each log file and combine the logs
      for (const file of logFiles) {
        try {
          const filePath = path.join(this.logDir, file);
          const fileContent = await fs.readFile(filePath, 'utf-8');
          const fileLogs = fileContent
            .split('\n')
            .filter(Boolean)
            .map((line) => JSON.parse(line) as LogEntry);
          allLogs.push(...fileLogs);
        } catch (fileError) {
          console.error(`Error reading log file ${file}:`, fileError);
          // Continue with other files
        }
      }
      
      // Sort all logs by timestamp (newest first)
      allLogs.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // Apply filters
      if (level) {
        allLogs = allLogs.filter((log) => log.level === level);
      }

      if (startDate) {
        allLogs = allLogs.filter((log) => new Date(log.timestamp) >= startDate);
      }

      if (endDate) {
        allLogs = allLogs.filter((log) => new Date(log.timestamp) <= endDate);
      }

      if (eventType) {
        const eventTypes = (Array.isArray(eventType) ? eventType : [eventType])
          .filter(Boolean)
          .map((e) => String(e));
        allLogs = allLogs.filter((log) => {
          if (!log.event) return false;
          return eventTypes.includes(String(log.event));
        });
      }

      if (search && search.trim()) {
        const needle = search.trim().toLowerCase();
        allLogs = allLogs.filter((log) => {
          const actorUserId = (log as any).actorUserId as string | undefined;
          const hay = [
            log.message,
            log.service,
            log.level,
            log.event,
            log.userId,
            actorUserId,
            (log as any).eventName,
            (log as any).operation,
            (log as any).setting,
            (log as any).key,
            (log as any).name,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          return hay.includes(needle);
        });
      }

      const total = allLogs.length;
      const page = allLogs.slice(offset, offset + limit);

      // Enrich page with username/name for userId + actorUserId (nice UI display)
      const ids = new Set<string>();
      for (const log of page) {
        if (typeof log.userId === 'string' && log.userId) ids.add(log.userId);
        if (typeof (log as any).actorUserId === 'string' && (log as any).actorUserId) {
          ids.add(String((log as any).actorUserId));
        }
      }

      let userMap = new Map<string, LogUserRef>();
      if (ids.size > 0) {
        try {
          const users = await this.prisma.user.findMany({
            where: { id: { in: Array.from(ids) } },
            select: { id: true, username: true, name: true },
          });
          userMap = new Map(users.map((u) => [u.id, u]));
        } catch (e) {
          // If enrichment fails, return raw logs
          this.warn('Failed to enrich logs with user info', {
            event: 'LOG_ENRICH_FAILED',
            error: e instanceof Error ? e.message : String(e),
          });
        }
      }

      const logs = page.map((log) => {
        const actorUserId = (log as any).actorUserId as string | undefined;
        return {
          ...log,
          user: log.userId ? userMap.get(String(log.userId)) : undefined,
          actor: actorUserId ? userMap.get(actorUserId) : undefined,
        };
      });

      return { logs, total };
    } catch (err) {
      const error = err as Error;
      console.error('Error in getLogs:', error);
      return { logs: [], total: 0 };
    }
  }

  audit(event: string, message: string, meta?: Record<string, unknown>) {
    this.info(message, { event, ...meta });
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
    userActivity: Record<string, number>;
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
        userActivity: {} as Record<string, number>,
        barrelActivity: {} as Record<string, number>,
      };

      logs.forEach((log: LogEntry) => {
        if (log.event) {
          const event = String(log.event);
          stats.eventCounts[event] = (stats.eventCounts[event] || 0) + 1;
        }

        if (log.userId) {
          const id = String(log.userId);
          stats.userActivity[id] = (stats.userActivity[id] || 0) + 1;
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
   * Logs when a beer is added to a user's record
   * @param userId - ID of the user
   * @param barrelId - Optional ID of the barrel the beer came from
   */
  logBeerAdded(
    userId: string,
    barrelId?: string | null,
    meta?: { actorUserId?: string; eventId?: string },
  ) {
    this.audit('BEER_ADDED', 'Beer added', {
      userId,
      barrelId,
      ...meta,
    });
  }

  /**
   * Logs when a beer is removed from a user's record
   * @param userId - ID of the user
   * @param barrelId - Optional ID of the barrel the beer came from
   */
  logBeerRemoved(
    userId: string,
    barrelId?: string | null,
    meta?: { actorUserId?: string; eventId?: string },
  ) {
    this.audit('BEER_REMOVED', 'Beer removed', {
      userId,
      barrelId,
      ...meta,
    });
  }

  logEventCreated(eventId: string, name: string, actorUserId: string) {
    this.audit('EVENT_CREATED', 'Event created', {
      eventId,
      eventName: name,
      actorUserId,
    });
  }

  logEventSetActive(
    eventId: string,
    actorUserId: string,
    previousEventId?: string | null,
  ) {
    this.audit('EVENT_SET_ACTIVE', 'Event set active', {
      eventId,
      actorUserId,
      previousEventId: previousEventId ?? undefined,
    });
  }

  logParticipantAdded(eventId: string, userId: string, actorUserId: string) {
    this.audit('PARTICIPANT_ADDED', 'Participant added to event', {
      eventId,
      userId,
      actorUserId,
    });
  }

  logBarrelAdded(eventId: string, barrelId: string, actorUserId: string) {
    this.audit('BARREL_ADDED', 'Barrel added to event', {
      eventId,
      barrelId,
      actorUserId,
    });
  }

  logParticipantRegistered(userId: string, username: string | null) {
    this.audit('PARTICIPANT_REGISTERED', 'Participant registered', {
      userId,
      username,
    });
  }

  logBeerPongEventCreated(
    beerPongEventId: string,
    eventId: string,
    name: string,
    actorUserId: string,
  ) {
    this.audit('BEER_PONG_EVENT_CREATED', 'Beer pong event created', {
      beerPongEventId,
      eventId,
      name,
      actorUserId,
    });
  }

  logBeerPongTeamCreated(params: {
    beerPongEventId: string;
    teamId: string;
    name: string;
    player1Id: string;
    player2Id: string;
    actorUserId: string;
  }) {
    this.audit('BEER_PONG_TEAM_CREATED', 'Beer pong team created', params);
  }

  logBeerPongStarted(beerPongEventId: string, actorUserId: string) {
    this.audit('BEER_PONG_STARTED', 'Beer pong started', {
      beerPongEventId,
      actorUserId,
    });
  }

  logSystemOperationTriggered(
    operation: string,
    actorUserId?: string,
    details?: Record<string, unknown>,
  ) {
    this.audit('SYSTEM_OPERATION_TRIGGERED', 'System operation triggered', {
      operation,
      actorUserId,
      details,
    });
  }

  /**
   * Logs when a new barrel is created
   * @param barrelId - ID of the barrel
   * @param size - Size of the barrel in liters
   */
  logBarrelCreated(barrelId: string, size: number) {
    this.info('Barrel created', {
      event: 'BARREL_CREATED',
      barrelId,
      size,
    });
  }

  /**
   * Logs when a barrel is deleted
   * @param barrelId - ID of the barrel
   */
  logBarrelDeleted(barrelId: string) {
    this.info('Barrel deleted', {
      event: 'BARREL_DELETED',
      barrelId,
    });
  }

  /**
   * Logs when a barrel's details are updated
   * @param barrelId - ID of the barrel
   * @param changes - Object containing the changes made
   */
  logBarrelUpdated(barrelId: string, changes: Record<string, any>) {
    this.info('Barrel updated', {
      event: 'BARREL_UPDATED',
      barrelId,
      changes,
    });
  }

  /**
   * Logs when a barrel's active status changes
   * @param barrelId - ID of the barrel
   * @param isActive - New active status
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
   * @param barrelId - ID of the barrel
   */
  logBarrelEmpty(barrelId: string) {
    this.info('Barrel is empty', {
      event: 'BARREL_EMPTY',
      barrelId,
    });
  }

  /**
   * Logs when a new user is created
   * @param userId - ID of the user
   * @param name - Name of the user
   * @param gender - Gender of the user
   */
  logUserCreated(userId: string, name: string, gender: string) {
    this.info('User created', {
      event: 'USER_CREATED',
      userId,
      name,
      gender,
    });
  }

  /**
   * Logs when a user's details are updated
   * @param userId - ID of the user
   * @param changes - Object containing the changes made
   */
  logUserUpdated(userId: string, changes: Record<string, any>) {
    this.info('User updated', {
      event: 'USER_UPDATED',
      userId,
      changes,
    });
  }

  /**
   * Logs when a user is deleted
   * @param userId - ID of the user
   */
  logUserDeleted(userId: string) {
    this.info('User deleted', {
      event: 'USER_DELETED',
      userId,
    });
  }

  /**
   * Logs when a user's beer count is updated
   * @param userId - ID of the user
   * @param oldCount - Previous beer count
   * @param newCount - New beer count
   */
  logUserBeerCountUpdated(userId: string, oldCount: number, newCount: number) {
    this.info('User beer count updated', {
      event: 'USER_BEER_COUNT_UPDATED',
      userId,
      oldCount,
      newCount,
    });
  }

  /**
   * Logs cleanup operations
   * @param type - Type of cleanup performed
   * @param details - Additional details about the cleanup
   */
  logCleanup(type: 'BARRELS' | 'USERS' | 'ALL', details?: Record<string, any>) {
    this.info('Cleanup performed', {
      event: 'CLEANUP',
      type,
      details,
    });
  }

  /**
   * Performs cleanup of log files based on specified options
   * @param options - Cleanup options
   */
  async cleanup(
    options: CleanupOptions = {},
  ): Promise<{ deletedCount: number }> {
    try {
      const files = await fs.readdir(this.logDir);
      let deletedCount = 0;

      for (const file of files) {
        if (!file.endsWith('.log')) continue;

        const filePath = path.join(this.logDir, file);
        const stats = await fs.stat(filePath);

        if (this.shouldDeleteFile(file, stats, options)) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }

      return { deletedCount };
    } catch (error) {
      this.error('Failed to cleanup logs', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Determines if a log file should be deleted based on cleanup options
   * @param fileName - Name of the log file
   * @param stats - File statistics
   * @param options - Cleanup options
   */
  private shouldDeleteFile(
    fileName: string,
    stats: Stats,
    options: CleanupOptions,
  ): boolean {
    if (options.olderThan && stats.mtime < options.olderThan) {
      return true;
    }

    if (options.levels?.length) {
      const fileLevel = fileName.split('-')[0].toLowerCase();
      if (options.levels.includes(fileLevel)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Generic log method
   * @param message - Message to log
   * @param type - Type of log entry
   */
  log(message: string, type: 'BARRELS' | 'USERS' | 'ALL'): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${type}] ${message}\n`;
    console.log(logEntry);
  }
}
