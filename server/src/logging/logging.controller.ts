import { Controller, Get, Query } from '@nestjs/common';
import { LoggingService } from './logging.service';

@Controller('logs')
export class LoggingController {
  constructor(private readonly loggingService: LoggingService) {}

  @Get()
  async getLogs(
    @Query('level') level?: string,
    @Query('limit') limit = '100',
    @Query('offset') offset = '0',
  ) {
    return this.loggingService.getLogs(level, +limit, +offset);
  }
}
