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
import { SystemExportBuilder } from '../exports/system/SystemExportBuilder';
import { UsersExportBuilder } from '../exports/users/UsersExportBuilder';
import type { StreamableFile } from '@nestjs/common';

@Controller('system')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR)
export class SystemController {
  constructor(
    private readonly systemService: SystemService,
    private readonly systemExportBuilder: SystemExportBuilder,
    private readonly usersExportBuilder: UsersExportBuilder,
  ) {}

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

  @Get('export/excel')
  @Roles(UserRole.SUPER_ADMIN)
  async exportSystemExcel(): Promise<StreamableFile> {
    return this.systemExportBuilder.build();
  }

  @Get('export/excel/users')
  @Roles(UserRole.SUPER_ADMIN)
  async exportUsersExcel(): Promise<StreamableFile> {
    return this.usersExportBuilder.build();
  }
}
