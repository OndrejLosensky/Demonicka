import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BackupService } from './backup.service';
import { BackupController } from './backup.controller';
import { EventsModule } from '../events/events.module';
import { EventBeer } from '../events/entities/event-beer.entity';
import { Event } from '../events/entities/event.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    EventsModule,
    TypeOrmModule.forFeature([EventBeer, Event]),
  ],
  controllers: [BackupController],
  providers: [BackupService],
})
export class BackupModule {} 