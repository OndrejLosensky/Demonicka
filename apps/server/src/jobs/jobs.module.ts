import { Module } from '@nestjs/common';
import { JobQueueModule } from '../job-queue/job-queue.module';
import { BackupModule } from '../backup/backup.module';
import { LoggingModule } from '../logging/logging.module';
import { EventsModule } from '../events/events.module';
import { JobsRegistrationService } from './jobs.registration';

@Module({
  imports: [
    JobQueueModule,
    BackupModule,
    LoggingModule,
    EventsModule,
  ],
  providers: [JobsRegistrationService],
})
export class JobsModule {}
