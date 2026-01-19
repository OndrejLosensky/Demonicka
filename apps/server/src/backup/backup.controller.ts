import { Controller, Post, UseGuards } from '@nestjs/common';
import { BackupService } from './backup.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { User } from '@prisma/client';
import { LoggingService } from '../logging/logging.service';

@Controller('backup')
@UseGuards(JwtAuthGuard, RoleGuard)
export class BackupController {
  constructor(
    private readonly backupService: BackupService,
    private readonly loggingService: LoggingService,
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
}
