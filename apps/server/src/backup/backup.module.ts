import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BackupService } from './backup.service';
import { BackupController } from './backup.controller';
import { LoggingModule } from '../logging/logging.module';
import { JobQueueModule } from '../job-queue/job-queue.module';
import { JobConfigModule } from '../job-config/job-config.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    LoggingModule,
    JobQueueModule,
    JobConfigModule,
    StorageModule,
  ],
  controllers: [BackupController],
  providers: [BackupService],
  exports: [BackupService],
})
export class BackupModule {}
