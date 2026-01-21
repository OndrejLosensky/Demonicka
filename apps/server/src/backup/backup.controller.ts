import { Controller, Post, UseGuards, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(BackupController.name);

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

  @Post('run')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR)
  async runBackupNow(@GetUser() user: User) {
    // Immediate logging - this should appear if request reaches controller
    console.log('=== BACKUP REQUEST RECEIVED (console.log) ===');
    console.log(`User: ${user?.id} (${user?.username})`);
    this.logger.log('=== BACKUP REQUEST RECEIVED (logger) ===');
    this.logger.log(`User: ${user?.id} (${user?.username})`);
    
    try {
      console.log('Before logSystemOperationTriggered...');
      this.loggingService.logSystemOperationTriggered('BACKUP_RUN', user?.id);
      console.log('After logSystemOperationTriggered...');
      this.logger.log('Calling backupService.runPgDumpAndUpload...');
      console.log('Before calling backupService.runPgDumpAndUpload...');
      
      const result = await this.backupService.runPgDumpAndUpload({
        trigger: 'manual',
        actorUserId: user?.id,
      });
      
      console.log('Backup completed successfully');
      this.logger.log('Backup completed successfully');
      return {
        message: 'Backup completed',
        fileName: result.fileName,
      };
    } catch (error) {
      // Log the error with full details
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error('=== BACKUP FAILED (console.error) ===', error);
      this.logger.error('=== BACKUP FAILED (logger) ===');
      this.logger.error(`Error: ${errorMessage}`);
      if (errorStack) {
        this.logger.error(`Stack: ${errorStack}`);
      }
      this.loggingService.logSystemOperationTriggered('BACKUP_RUN_FAILED', user?.id);
      throw error; // Re-throw to let NestJS handle the HTTP error response
    }
  }
}
