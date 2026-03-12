import type { JobHandlerRegistry } from '../../job-queue/job-handler.registry';
import type { BackupService } from '../../backup/backup.service';
import type { LoggingService } from '../../logging/logging.service';
import { JOB_TYPES } from '../../job-queue/job-handler.registry';
import { BACKUP_RETENTION_DAYS } from '../../backup/backup.service';

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

      // 1. Retention: delete old S3 backups first
      context.appendLog(
        'info',
        `Starting backup retention (delete backups older than ${BACKUP_RETENTION_DAYS} days)`,
      );
      try {
        const retentionResult = await backupService.deleteOldBackupsInS3(
          BACKUP_RETENTION_DAYS,
        );
        for (const key of retentionResult.deletedKeys) {
          context.appendLog('info', `Deleted: ${key}`);
        }
        context.appendLog(
          'info',
          `Retention complete: deleted ${retentionResult.deletedCount} backup(s).`,
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        context.appendLog('warn', `Retention failed (continuing): ${message}`);
      }

      // 2. Run backup (pg_dump + upload)
      context.appendLog('info', `Starting backup (${trigger})`);
      try {
        const result = await backupService.runPgDumpAndUpload({
          trigger,
          actorUserId,
        });
        context.appendLog('info', `Backup completed: ${result.fileName}`);

        // 3. Verify: confirm the new backup is in S3
        context.appendLog('info', 'Starting backup verify (S3)');
        try {
          const verifyResult = await backupService.verifyBackupsInS3();
          context.appendLog(
            'info',
            `Listed ${verifyResult.totalCount} backup(s) in S3`,
          );
          if (verifyResult.latestKey) {
            context.appendLog('info', `Latest backup: ${verifyResult.latestKey}`);
          }
          context.appendLog(
            'info',
            verifyResult.verified
              ? 'Verified latest backup (readable and non-empty).'
              : 'Could not verify latest backup (missing or unreadable).',
          );
        } catch (verifyError) {
          const msg =
            verifyError instanceof Error
              ? verifyError.message
              : String(verifyError);
          context.appendLog('warn', `Backup verify failed (backup succeeded): ${msg}`);
        }

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
