import type { JobHandlerRegistry } from '../../job-queue/job-handler.registry';
import type { BackupService } from '../../backup/backup.service';
import { JOB_TYPES } from '../../job-queue/job-handler.registry';
import { BACKUP_RETENTION_DAYS } from '../../backup/backup.service';

export function registerBackupRetentionHandler(
  registry: JobHandlerRegistry,
  backupService: BackupService,
): void {
  registry.register(
    JOB_TYPES.BACKUP_RETENTION,
    async (_payload, _jobId, context) => {
      context.appendLog(
        'info',
        `Starting backup retention (delete backups older than ${BACKUP_RETENTION_DAYS} days)`,
      );
      try {
        const result = await backupService.deleteOldBackupsInS3(
          BACKUP_RETENTION_DAYS,
        );
        for (const key of result.deletedKeys) {
          context.appendLog('info', `Deleted: ${key}`);
        }
        context.appendLog(
          'info',
          `Retention complete: deleted ${result.deletedCount} backup(s).`,
        );
        return result;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        context.appendLog('error', `Backup retention failed: ${message}`);
        throw error;
      }
    },
  );
}
