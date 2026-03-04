import { Injectable } from '@nestjs/common';
import * as winston from 'winston';
import { format } from 'winston';
import * as fs from 'fs/promises';
import * as path from 'path';
import 'winston-daily-rotate-file';
import type { Stats } from 'fs';
import type { DailyRotateFileTransportOptions } from 'winston-daily-rotate-file';
import { PrismaService } from '../prisma/prisma.service';
import { getAppFromContext } from './request-context';

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  app: string;
  event?: string;
  userId?: string;
  actorUserId?: string;
  barrelId?: string;
  /** @deprecated use app */
  service?: string;
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
  private readonly backendLogDir = path.join(this.logDir, 'backend');

  constructor(private readonly prisma: PrismaService) {
    // Ensure log directories exist
    fs.mkdir(this.backendLogDir, { recursive: true }).catch(() => {});

    // Canonical format: timestamp, app, level (uppercase), message, ...meta
    const canonicalFormat = format((info) => {
      const level = String(info.level ?? 'info').toUpperCase();
      const normalizedLevel = level === 'WARN' ? 'WARN' : level === 'ERROR' ? 'ERROR' : level === 'DEBUG' ? 'DEBUG' : 'INFO';
      return {
        ...info,
        level: normalizedLevel,
        app: info.app ?? 'backend',
        timestamp: info.timestamp ?? new Date().toISOString(),
      };
    })();

    // Configure daily rotating log file for all log levels (backend only)
    const rotateConfig: DailyRotateFileTransportOptions = {
      filename: path.join(this.backendLogDir, '%DATE%-combined.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: format.combine(format.timestamp(), canonicalFormat, format.json()),
    };

    // Configure daily rotating log file specifically for errors
    const errorRotateConfig: DailyRotateFileTransportOptions = {
      filename: path.join(this.backendLogDir, '%DATE%-error.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error',
      format: format.combine(format.timestamp(), canonicalFormat, format.json()),
    };

    const rotateFileTransport = new winston.transports.DailyRotateFile(
      rotateConfig,
    );
    const errorRotateFileTransport = new winston.transports.DailyRotateFile(
      errorRotateConfig,
    );

    // Initialize winston logger with file transports (canonical: app, level, timestamp, message, ...meta)
    this.logger = winston.createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        canonicalFormat,
        format.json(),
      ),
      defaultMeta: { app: 'backend' },
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
   * Ingest a single log entry from web or mobile client.
   * Appends one JSON line to logs/{app}/%DATE%-combined.log in canonical format.
   */
  async ingestLog(payload: {
    app: 'web' | 'mobile';
    level: string;
    message: string;
    event?: string;
    actorUserId?: string;
    timestamp?: string;
    meta?: Record<string, unknown>;
    [key: string]: unknown;
  }): Promise<void> {
    const level = String(payload.level ?? 'INFO').toUpperCase();
    const normalizedLevel = level === 'WARN' ? 'WARN' : level === 'ERROR' ? 'ERROR' : level === 'DEBUG' ? 'DEBUG' : 'INFO';
    const timestamp = payload.timestamp ?? new Date().toISOString();
    const { app, message, event, actorUserId, level: _level, meta = {}, ...rest } = payload;
    const entry: LogEntry = {
      timestamp,
      app,
      level: normalizedLevel,
      message,
      ...(event && { event }),
      ...(actorUserId && { actorUserId }),
      ...meta,
      ...rest,
    };
    const dateStr = timestamp.slice(0, 10); // YYYY-MM-DD
    const dir = path.join(this.logDir, app);
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, `${dateStr}-combined.log`);
    const line = JSON.stringify(entry) + '\n';
    await fs.appendFile(filePath, line);
  }

  /**
   * Retrieves logs based on specified filters.
   * Reads from logs/backend/, logs/web/, logs/mobile/ and merges by timestamp.
   */
  async getLogs(
    level?: string,
    limit = 100,
    offset = 0,
    startDate?: Date,
    endDate?: Date,
    eventType?: string | string[],
    search?: string,
    appFilter?: string,
  ): Promise<{
    logs: (LogEntry & { user?: LogUserRef; actor?: LogUserRef })[];
    total: number;
  }> {
    try {
      const appDirs = ['backend', 'web', 'mobile'] as const;
      let allLogs: LogEntry[] = [];

      for (const appName of appDirs) {
        const dir = path.join(this.logDir, appName);
        try {
          const files = await fs.readdir(dir);
          const logFiles = files.filter((f) => f.endsWith('-combined.log'));
          for (const file of logFiles) {
            try {
              const filePath = path.join(dir, file);
              const fileContent = await fs.readFile(filePath, 'utf-8');
              const fileLogs = fileContent
                .split('\n')
                .filter(Boolean)
                .map((line) => {
                  const parsed = JSON.parse(line) as LogEntry;
                  // Ensure app and level are set (canonical format)
                  const level = String(parsed.level ?? 'info').toUpperCase();
                  const normalizedLevel = level === 'WARN' ? 'WARN' : level === 'ERROR' ? 'ERROR' : level === 'DEBUG' ? 'DEBUG' : 'INFO';
                  return {
                    ...parsed,
                    app: parsed.app ?? appName,
                    level: normalizedLevel,
                  } as LogEntry;
                });
              allLogs.push(...fileLogs);
            } catch (fileError) {
              console.error(`Error reading log file ${dir}/${file}:`, fileError);
            }
          }
        } catch (dirError) {
          // Subdir may not exist yet (e.g. no ingest yet)
          if ((dirError as NodeJS.ErrnoException)?.code !== 'ENOENT') {
            console.error(`Error reading log dir ${dir}:`, dirError);
          }
        }
      }

      // Sort by timestamp (newest first)
      allLogs.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

      // Filter by app (source)
      if (appFilter && ['backend', 'web', 'mobile'].includes(appFilter)) {
        allLogs = allLogs.filter((log) => (log.app ?? 'backend') === appFilter);
      }

      // Apply filters
      if (level) {
        const levelUpper = level.toUpperCase();
        allLogs = allLogs.filter((log) => (log.level ?? '').toUpperCase() === levelUpper);
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
            log.app,
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

      // Enrich page with username/name for userId + actorUserId
      const ids = new Set<string>();
      for (const log of page) {
        if (typeof log.userId === 'string' && log.userId) ids.add(log.userId);
        if (
          typeof (log as any).actorUserId === 'string' &&
          (log as any).actorUserId
        ) {
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
          app: log.app ?? 'backend',
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
   * Logs a failed action as an audit event (WARN level) so it appears in Aktivity.
   * Use for e.g. BEER_ADD_FAILED, BARREL_CREATE_FAILED when the server rejects the request.
   */
  auditFailure(
    event: string,
    message: string,
    meta?: Record<string, unknown>,
  ) {
    this.warn(message, { event, ...meta });
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
        undefined,
        undefined,
      );

      const stats = {
        totalLogs: logs.length,
        errorCount: logs.filter((log) => (log.level ?? '').toUpperCase() === 'ERROR').length,
        warnCount: logs.filter((log) => (log.level ?? '').toUpperCase() === 'WARN').length,
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
   * Merges request context app (X-App header) into meta when present.
   */
  private withContextApp(meta?: Record<string, unknown>): Record<string, unknown> {
    const ctxApp = getAppFromContext();
    if (!ctxApp) return meta ?? {};
    return { ...meta, app: ctxApp };
  }

  /**
   * Logs an error message with optional metadata
   */
  error(message: string, meta?: Record<string, unknown>) {
    this.logger.error(message, this.withContextApp(meta));
  }

  /**
   * Logs a warning message with optional metadata
   */
  warn(message: string, meta?: Record<string, unknown>) {
    this.logger.warn(message, this.withContextApp(meta));
  }

  /**
   * Logs an info message with optional metadata
   */
  info(message: string, meta?: Record<string, unknown>) {
    this.logger.info(message, this.withContextApp(meta));
  }

  /**
   * Logs a debug message with optional metadata
   */
  debug(message: string, meta?: Record<string, unknown>) {
    this.logger.debug(message, this.withContextApp(meta));
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
      ...(details ?? {}),
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
   * Performs cleanup of log files based on specified options.
   * Scans logs/backend, logs/web, logs/mobile for .log files.
   */
  async cleanup(
    options: CleanupOptions = {},
  ): Promise<{ deletedCount: number }> {
    let deletedCount = 0;
    const appDirs = ['backend', 'web', 'mobile'] as const;

    for (const appName of appDirs) {
      const dir = path.join(this.logDir, appName);
      try {
        const files = await fs.readdir(dir);
        for (const file of files) {
          if (!file.endsWith('.log')) continue;
          const filePath = path.join(dir, file);
          const stats = await fs.stat(filePath);
          if (this.shouldDeleteFile(file, stats, options)) {
            await fs.unlink(filePath);
            deletedCount++;
          }
        }
      } catch (e) {
        if ((e as NodeJS.ErrnoException)?.code !== 'ENOENT') {
          this.error('Failed to cleanup log dir', { dir, error: String(e) });
        }
      }
    }

    return { deletedCount };
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
