import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { User } from '@prisma/client';
import { JobConfigService, JOB_CONFIG_KEYS } from './job-config.service';
import { Versions } from '../versioning/decorators/version.decorator';
import { VersionGuard } from '../versioning/guards/version.guard';

@Controller('system/job-config')
@Versions('1')
@UseGuards(JwtAuthGuard, VersionGuard, RoleGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR)
export class JobConfigController {
  constructor(private readonly jobConfigService: JobConfigService) {}

  @Get()
  async get() {
    const [enabled, intervalHours] = await Promise.all([
      this.jobConfigService.getBackupEnabled(),
      this.jobConfigService.getBackupIntervalHours(),
    ]);
    return {
      [JOB_CONFIG_KEYS.BACKUP_ENABLED]: enabled,
      [JOB_CONFIG_KEYS.BACKUP_INTERVAL_HOURS]: intervalHours,
    };
  }

  @Patch()
  async patch(
    @Body()
    body: {
      [JOB_CONFIG_KEYS.BACKUP_ENABLED]?: boolean;
      [JOB_CONFIG_KEYS.BACKUP_INTERVAL_HOURS]?: number;
    },
    @GetUser() user: User,
  ) {
    const userId = user?.id ?? null;
    if (body[JOB_CONFIG_KEYS.BACKUP_ENABLED] !== undefined) {
      await this.jobConfigService.set(
        JOB_CONFIG_KEYS.BACKUP_ENABLED,
        body[JOB_CONFIG_KEYS.BACKUP_ENABLED],
        userId,
      );
    }
    if (body[JOB_CONFIG_KEYS.BACKUP_INTERVAL_HOURS] !== undefined) {
      const val = Number(body[JOB_CONFIG_KEYS.BACKUP_INTERVAL_HOURS]);
      const clamped = Math.min(24, Math.max(1, Math.floor(val)));
      await this.jobConfigService.set(
        JOB_CONFIG_KEYS.BACKUP_INTERVAL_HOURS,
        clamped,
        userId,
      );
    }
    return this.get();
  }
}
