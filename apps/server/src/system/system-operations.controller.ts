import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { JobQueueService } from '../job-queue/job-queue.service';
import { JOB_TYPES } from '../job-queue/job-handler.registry';
import type { User } from '@prisma/client';
import { Versions } from '../versioning/decorators/version.decorator';
import { VersionGuard } from '../versioning/guards/version.guard';
import { LoggingService } from '../logging/logging.service';

const DEFAULT_RETENTION_DAYS = 14;
const MIN_RETENTION_DAYS = 1;
const MAX_RETENTION_DAYS = 365;

@Controller('system/operations')
@Versions('1')
@UseGuards(JwtAuthGuard, VersionGuard)
export class SystemOperationsController {
  constructor(
    private readonly jobQueueService: JobQueueService,
    private readonly loggingService: LoggingService,
  ) {}

  @Post('cleanup-system')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR)
  async cleanupSystem(@GetUser() user: User) {
    const jobId = await this.jobQueueService.enqueue({
      type: JOB_TYPES.CLEANUP_SYSTEM,
      payload: {},
      createdByUserId: user?.id,
    });
    this.loggingService.logSystemOperationTriggered('CLEANUP_SYSTEM', user?.id, { jobId });
    return { jobId, status: 'queued' as const };
  }

  @Post('cleanup-active-event')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR)
  async cleanupActiveEvent(@GetUser() user: User) {
    const jobId = await this.jobQueueService.enqueue({
      type: JOB_TYPES.CLEANUP_ACTIVE_EVENT,
      payload: {},
      createdByUserId: user?.id,
    });
    this.loggingService.logSystemOperationTriggered('CLEANUP_ACTIVE_EVENT', user?.id, { jobId });
    return { jobId, status: 'queued' as const };
  }

  @Post('clear-all-logs')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR)
  async clearAllLogs(@GetUser() user: User) {
    const jobId = await this.jobQueueService.enqueue({
      type: JOB_TYPES.CLEAR_ALL_LOGS,
      payload: {},
      createdByUserId: user?.id,
    });
    this.loggingService.logSystemOperationTriggered('CLEAR_ALL_LOGS', user?.id, { jobId });
    return { jobId, status: 'queued' as const };
  }

  @Post('logs-retention')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR)
  async logsRetention(
    @GetUser() user: User,
    @Body() body: { retentionDays?: number },
  ) {
    const raw = body?.retentionDays;
    const retentionDays =
      typeof raw === 'number' && raw >= MIN_RETENTION_DAYS && raw <= MAX_RETENTION_DAYS
        ? Math.floor(raw)
        : DEFAULT_RETENTION_DAYS;
    const jobId = await this.jobQueueService.enqueue({
      type: JOB_TYPES.LOGS_RETENTION,
      payload: { retentionDays },
      createdByUserId: user?.id,
    });
    this.loggingService.logSystemOperationTriggered('LOGS_RETENTION', user?.id, {
      jobId,
      retentionDays,
    });
    return { jobId, status: 'queued' as const };
  }
}
