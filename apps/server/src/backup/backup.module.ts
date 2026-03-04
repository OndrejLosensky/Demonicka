import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BackupService } from './backup.service';
import { BackupController } from './backup.controller';
import { BackupJobHandlerRegistration } from './backup-job-handler.registration';
import { LoggingModule } from '../logging/logging.module';
import { JobQueueModule } from '../job-queue/job-queue.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    LoggingModule,
    JobQueueModule,
    StorageModule,
  ],
  controllers: [BackupController],
  providers: [BackupService, BackupJobHandlerRegistration],
})
export class BackupModule {}
