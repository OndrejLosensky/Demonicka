import type { JobHandlerRegistry } from '../../job-queue/job-handler.registry';
import { JOB_TYPES } from '../../job-queue/job-handler.registry';
import type { LoggingService } from '../../logging/logging.service';
import type { EventsService } from '../../events/events.service';

const LOG_RETENTION_DAYS = 7;
const LOG_RETENTION_MS = LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000;

/** Default retention days when not specified in payload (e.g. for scheduled runs). */
const DEFAULT_LOGS_RETENTION_DAYS = 14;

export function registerCleanupHandlers(
  registry: JobHandlerRegistry,
  loggingService: LoggingService,
  eventsService: EventsService,
): void {
  registry.register(
    JOB_TYPES.CLEANUP_SYSTEM,
    async (_payload, _jobId, context) => {
      context.appendLog('info', 'Starting system cleanup (old logs and temp files)');
      const result = await loggingService.cleanup({
        olderThan: new Date(Date.now() - LOG_RETENTION_MS),
      });
      context.appendLog('info', `Deleted ${result.deletedCount} old log file(s) (older than ${LOG_RETENTION_DAYS} days).`);
      return { deletedCount: result.deletedCount };
    },
  );

  registry.register(
    JOB_TYPES.LOGS_RETENTION,
    async (payload, _jobId, context) => {
      const retentionDays =
        typeof (payload as { retentionDays?: number }).retentionDays === 'number'
          ? Math.max(1, Math.min(365, (payload as { retentionDays: number }).retentionDays))
          : DEFAULT_LOGS_RETENTION_DAYS;
      const olderThan = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
      context.appendLog('info', `Starting logs retention cleanup (delete logs older than ${retentionDays} days)`);
      const result = await loggingService.cleanup({ olderThan });
      context.appendLog('info', `Deleted ${result.deletedCount} log file(s) older than ${retentionDays} days.`);
      return { deletedCount: result.deletedCount, retentionDays };
    },
  );

  registry.register(
    JOB_TYPES.CLEANUP_ACTIVE_EVENT,
    async (_payload, _jobId, context) => {
      context.appendLog('info', 'Cleaning up active event data');
      const result = await eventsService.cleanupActiveEvent();
      if (!result) {
        context.appendLog('warn', 'No active event to clean.');
        return { eventName: null, beersDeleted: 0, usersRemoved: 0 };
      }
      context.appendLog(
        'info',
        `Active event "${result.eventName}" cleared: ${result.beersDeleted} beers, ${result.usersRemoved} participants removed.`,
      );
      return result;
    },
  );

  registry.register(
    JOB_TYPES.CLEAR_ALL_LOGS,
    async (_payload, _jobId, context) => {
      context.appendLog('info', 'Starting clear all logs');
      const result = await loggingService.clearAllLogs();
      context.appendLog('info', `Deleted ${result.deletedCount} log file(s).`);
      return { deletedCount: result.deletedCount };
    },
  );
}
