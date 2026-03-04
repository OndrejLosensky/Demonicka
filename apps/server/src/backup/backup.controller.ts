import { Controller, Post, UseGuards, Logger } from '@nestjs/common';
import { BackupService } from './backup.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { User } from '@prisma/client';
import { LoggingService } from '../logging/logging.service';
import { JobQueueService } from '../job-queue/job-queue.service';
import { JOB_TYPES } from '../job-queue/job-handler.registry';

@Controller('backup')
@UseGuards(JwtAuthGuard, RoleGuard)
export class BackupController {
  private readonly logger = new Logger(BackupController.name);

  constructor(
    private readonly backupService: BackupService,
    private readonly loggingService: LoggingService,
    private readonly jobQueueService: JobQueueService,
  ) {}

  @Post('cleanup-orphaned-beers')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR)
  async cleanupOrphanedEventBeers(@GetUser() user: User) {
    this.loggingService.logSystemOperationTriggered(
      'BACKUP_CLEANUP_ORPHANED_BEERS',
      user?.id,
    );
    await this.backupService.cleanupOrphanedEventBeers();
    return { message: 'Cleanup completed successfully' };
  }

  @Post('run')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR)
  async runBackupNow(@GetUser() user: User) {
    this.logger.log(`Backup run requested by user ${user?.id} (${user?.username})`);

    const jobId = await this.jobQueueService.enqueue({
      type: JOB_TYPES.BACKUP_RUN,
      payload: { trigger: 'manual', actorUserId: user?.id },
      createdByUserId: user?.id,
    });

    this.loggingService.logSystemOperationTriggered('BACKUP_RUN', user?.id, {
      jobId,
    });

    return { jobId, status: 'queued' };
  }
}
