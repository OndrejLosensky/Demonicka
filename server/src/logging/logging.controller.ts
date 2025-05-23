import {
  Controller,
  Get,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { LoggingService } from './logging.service';
import { DatePipe } from './date.pipe';

@Controller('logs')
export class LoggingController {
  constructor(private readonly loggingService: LoggingService) {}

  @Get()
  async getLogs(
    @Query('level') level?: string,
    @Query('limit', ParseIntPipe) limit = 100,
    @Query('offset', ParseIntPipe) offset = 0,
    @Query('startDate', DatePipe) startDate?: Date,
    @Query('endDate', DatePipe) endDate?: Date,
    @Query('eventType') eventType?: string,
  ) {
    return this.loggingService.getLogs(
      level,
      limit,
      offset,
      startDate,
      endDate,
      eventType,
    );
  }

  @Get('stats')
  async getLogStats(
    @Query('startDate', DatePipe) startDate?: Date,
    @Query('endDate', DatePipe) endDate?: Date,
  ) {
    return this.loggingService.getLogStats(startDate, endDate);
  }
}
