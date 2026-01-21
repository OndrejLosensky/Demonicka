import { Module } from '@nestjs/common';
import { EventPaceService } from './event-pace.service';

@Module({
  providers: [EventPaceService],
  exports: [EventPaceService],
})
export class EventPaceModule {}

