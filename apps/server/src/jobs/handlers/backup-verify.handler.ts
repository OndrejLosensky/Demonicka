import type { JobHandlerRegistry } from '../../job-queue/job-handler.registry';
import type { BackupService } from '../../backup/backup.service';
import { JOB_TYPES } from '../../job-queue/job-handler.registry';

export function registerBackupVerifyHandler(
  registry: JobHandlerRegistry,
  backupService: BackupService,
): void {
  registry.register(
    JOB_TYPES.BACKUP_VERIFY,
    async (_payload, _jobId, context) => {
      context.appendLog('info', 'Starting backup verify (S3)');
      try {
        const result = await backupService.verifyBackupsInS3();
        context.appendLog('info', `Listed ${result.totalCount} backup(s) in S3`);
        if (result.totalCount === 0) {
          context.appendLog('info', 'No backups to verify.');
          return result;
        }
        if (result.latestKey) {
          context.appendLog('info', `Latest backup: ${result.latestKey}`);
        }
        context.appendLog(
          'info',
          result.verified
            ? 'Verified latest backup (readable and non-empty).'
            : 'Could not verify latest backup (missing or unreadable).',
        );
        return result;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        context.appendLog('error', `Backup verify failed: ${message}`);
        throw error;
      }
    },
  );
}
