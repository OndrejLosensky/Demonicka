import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BackupService } from './backup.service';
import { BackupController } from './backup.controller';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [ScheduleModule.forRoot(), EventsModule],
  controllers: [BackupController],
  providers: [BackupService],
})
export class BackupModule {}
