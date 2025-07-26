import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BackupService } from './backup.service';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    EventsModule,
  ],
  providers: [BackupService],
})
export class BackupModule {} 