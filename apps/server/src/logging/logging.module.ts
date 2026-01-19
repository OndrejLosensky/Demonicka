import { Module } from '@nestjs/common';
import { LoggingService } from './logging.service';
import { LoggingController } from './logging.controller';
import { DatePipe } from './date.pipe';
import { AppLogger } from './app-logger.service';

@Module({
  providers: [LoggingService, DatePipe, AppLogger],
  exports: [LoggingService, AppLogger],
  controllers: [LoggingController],
})
export class LoggingModule {}
