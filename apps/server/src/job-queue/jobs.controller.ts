import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  NotFoundException,
  ForbiddenException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JobQueueService } from './job-queue.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { User, UserRole } from '@prisma/client';
import { JobStatus } from '@prisma/client';
import { Versions } from '../versioning/decorators/version.decorator';
import { VersionGuard } from '../versioning/guards/version.guard';

@Controller('jobs')
@Versions('1')
@UseGuards(JwtAuthGuard, VersionGuard)
export class JobsController {
  constructor(private readonly jobQueueService: JobQueueService) {}

  @Get()
  async list(
    @GetUser() user: User,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    const isAdmin =
      user.role === UserRole.SUPER_ADMIN || user.role === UserRole.OPERATOR;
    const parsedLimit = limit ? Math.min(100, Math.max(1, parseInt(limit, 10))) : 50;
    const validStatuses: JobStatus[] = ['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED'];
    const statusFilter = status && validStatuses.includes(status as JobStatus) ? (status as JobStatus) : undefined;
    return this.jobQueueService.listJobs({
      userId: user.id,
      isAdmin,
      status: statusFilter,
      limit: isNaN(parsedLimit) ? 50 : parsedLimit,
    });
  }

  /**
   * Admin: mark stale RUNNING as failed and re-queue all QUEUED jobs from DB.
   * Use after restart or when jobs appear stuck.
   */
  @Post('actions/recover')
  @UseGuards(RoleGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR)
  async recover() {
    return this.jobQueueService.runRecovery();
  }

  /**
   * Cancel a QUEUED or RUNNING job (mark as FAILED). Admin or job creator.
   */
  @Post(':id/cancel')
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
    @Body() body: { message?: string },
  ) {
    const job = await this.jobQueueService.getJob(id);
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    const isAdmin =
      user.role === UserRole.SUPER_ADMIN || user.role === UserRole.OPERATOR;
    const isCreator = job.createdByUserId === user.id;
    if (!isCreator && !isAdmin) {
      throw new ForbiddenException('You do not have access to this job');
    }
    if (job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED) {
      throw new ForbiddenException('Job is already finished');
    }
    const updated = await this.jobQueueService.markJobFailed(
      id,
      body?.message ?? 'Job cancelled by user.',
    );
    return { cancelled: updated };
  }

  @Get(':id')
  async getOne(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ) {
    const job = await this.jobQueueService.getJob(id);
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    const isAdmin =
      user.role === UserRole.SUPER_ADMIN || user.role === UserRole.OPERATOR;
    const isCreator = job.createdByUserId === user.id;
    if (!isCreator && !isAdmin) {
      throw new ForbiddenException('You do not have access to this job');
    }
    return job;
  }
}
