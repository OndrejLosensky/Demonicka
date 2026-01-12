import { Module } from '@nestjs/common';
import { LoggingService } from './logging.service';
import { LoggingController } from './logging.controller';
import { DatePipe } from './date.pipe';

@Module({
  providers: [LoggingService, DatePipe],
  exports: [LoggingService],
  controllers: [LoggingController],
})
export class LoggingModule {}
