import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { SystemService } from './system.service';

@Controller('system')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('health')
  async getSystemHealth() {
    return this.systemService.getSystemHealth();
  }

  @Get('performance')
  async getPerformanceMetrics() {
    return this.systemService.getPerformanceMetrics();
  }

  @Get('alerts')
  async getSystemAlerts() {
    return this.systemService.getSystemAlerts();
  }

  @Post('alerts/:id/resolve')
  async resolveAlert(@Param('id', ParseUUIDPipe) id: string) {
    return this.systemService.resolveAlert(id);
  }

  @Get('database/stats')
  async getDatabaseStats() {
    return this.systemService.getDatabaseStats();
  }

  @Get('logs/stats')
  async getLogStats() {
    return this.systemService.getLogStats();
  }
} 