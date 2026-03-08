import type { JobHandlerRegistry } from '../../job-queue/job-handler.registry';
import type { BackupService } from '../../backup/backup.service';
import type { LoggingService } from '../../logging/logging.service';
import { JOB_TYPES } from '../../job-queue/job-handler.registry';

interface BackupRunPayload {
  trigger: 'manual' | 'cron';
  actorUserId?: string;
}

export function registerBackupRunHandler(
  registry: JobHandlerRegistry,
  backupService: BackupService,
  loggingService: LoggingService,
): void {
  registry.register(
    JOB_TYPES.BACKUP_RUN,
    async (payload, jobId, context) => {
      const { trigger, actorUserId } = payload as BackupRunPayload;
      context.appendLog('info', `Starting backup (${trigger})`);
      try {
        const result = await backupService.runPgDumpAndUpload({
          trigger,
          actorUserId,
        });
        context.appendLog('info', `Backup completed: ${result.fileName}`);
        return { fileName: result.fileName };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        context.appendLog('error', `Backup failed: ${message}`);
        if (actorUserId) {
          loggingService.logSystemOperationTriggered(
            'BACKUP_RUN_FAILED',
            actorUserId,
          );
        }
        if (
          message.includes('server version mismatch') ||
          message.includes('pg_dump version')
        ) {
          throw new Error(
            'Nesoulad verzí pg_dump a databázového serveru. Nainstalujte pg_dump stejné verze jako server (např. brew install libpq nebo PostgreSQL 17). Původní chyba: ' +
              message,
          );
        }
        throw error;
      }
    },
  );
}
