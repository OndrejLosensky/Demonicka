import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  JobHandlerRegistry,
  JOB_TYPES,
} from '../job-queue/job-handler.registry';
import { BackupService } from '../backup/backup.service';
import { LoggingService } from '../logging/logging.service';
import { EventsService } from '../events/events.service';
import { AchievementsService } from '../achievements/achievements.service';
import { registerBackupRunHandler } from './handlers/backup-run.handler';
import { registerBackupVerifyHandler } from './handlers/backup-verify.handler';
import { registerBackupRetentionHandler } from './handlers/backup-retention.handler';
import { registerCleanupHandlers } from './handlers/cleanup.handlers';
import { registerAchievementsCheckHandler } from './handlers/achievements-check.handler';

@Injectable()
export class JobsRegistrationService implements OnModuleInit {
  constructor(
    private readonly jobHandlerRegistry: JobHandlerRegistry,
    private readonly backupService: BackupService,
    private readonly loggingService: LoggingService,
    private readonly eventsService: EventsService,
    private readonly achievementsService: AchievementsService,
  ) {}

  onModuleInit(): void {
    registerBackupRunHandler(
      this.jobHandlerRegistry,
      this.backupService,
      this.loggingService,
    );
    registerBackupVerifyHandler(this.jobHandlerRegistry, this.backupService);
    registerBackupRetentionHandler(this.jobHandlerRegistry, this.backupService);
    registerCleanupHandlers(
      this.jobHandlerRegistry,
      this.loggingService,
      this.eventsService,
    );
    registerAchievementsCheckHandler(
      this.jobHandlerRegistry,
      this.achievementsService,
    );
  }
}

export { JOB_TYPES };
