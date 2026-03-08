import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  JobHandlerRegistry,
  JOB_TYPES,
} from '../job-queue/job-handler.registry';
import { BackupService } from '../backup/backup.service';
import { LoggingService } from '../logging/logging.service';
import { EventsService } from '../events/events.service';
import { registerBackupRunHandler } from './handlers/backup-run.handler';
import { registerCleanupHandlers } from './handlers/cleanup.handlers';

@Injectable()
export class JobsRegistrationService implements OnModuleInit {
  constructor(
    private readonly jobHandlerRegistry: JobHandlerRegistry,
    private readonly backupService: BackupService,
    private readonly loggingService: LoggingService,
    private readonly eventsService: EventsService,
  ) {}

  onModuleInit(): void {
    registerBackupRunHandler(
      this.jobHandlerRegistry,
      this.backupService,
      this.loggingService,
    );
    registerCleanupHandlers(
      this.jobHandlerRegistry,
      this.loggingService,
      this.eventsService,
    );
  }
}

export { JOB_TYPES };
