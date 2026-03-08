import type { JobHandlerRegistry } from '../../job-queue/job-handler.registry';
import { JOB_TYPES } from '../../job-queue/job-handler.registry';
import type { LoggingService } from '../../logging/logging.service';
import type { EventsService } from '../../events/events.service';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

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
        olderThan: new Date(Date.now() - THIRTY_DAYS_MS),
      });
      context.appendLog('info', `Deleted ${result.deletedCount} old log file(s).`);
      return { deletedCount: result.deletedCount };
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
}
