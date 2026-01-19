import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BackupService } from './backup.service';
import { BackupController } from './backup.controller';
import { EventsModule } from '../events/events.module';
import { LoggingModule } from '../logging/logging.module';

@Module({
  imports: [ScheduleModule.forRoot(), EventsModule, LoggingModule],
  controllers: [BackupController],
  providers: [BackupService],
})
export class BackupModule {}
