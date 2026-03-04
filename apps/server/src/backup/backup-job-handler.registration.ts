import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  JobHandlerRegistry,
  JOB_TYPES,
} from '../job-queue/job-handler.registry';
import { BackupService } from './backup.service';
import { LoggingService } from '../logging/logging.service';

interface BackupRunPayload {
  trigger: 'manual' | 'cron';
  actorUserId?: string;
}

@Injectable()
export class BackupJobHandlerRegistration implements OnModuleInit {
  constructor(
    private readonly jobHandlerRegistry: JobHandlerRegistry,
    private readonly backupService: BackupService,
    private readonly loggingService: LoggingService,
  ) {}

  onModuleInit(): void {
    this.jobHandlerRegistry.register(
      JOB_TYPES.BACKUP_RUN,
      async (payload, jobId) => {
        void jobId;
        const { trigger, actorUserId } = payload as BackupRunPayload;
        try {
          const result = await this.backupService.runPgDumpAndUpload({
            trigger,
            actorUserId,
          });
          return { fileName: result.fileName };
        } catch (error) {
          if (actorUserId) {
            this.loggingService.logSystemOperationTriggered(
              'BACKUP_RUN_FAILED',
              actorUserId,
            );
          }
          const message =
            error instanceof Error ? error.message : String(error);
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
}
