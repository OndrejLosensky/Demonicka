import { Controller, Post, UseGuards } from '@nestjs/common';
import { BackupService } from './backup.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from "@prisma/client"';

@Controller('backup')
@UseGuards(JwtAuthGuard, RoleGuard)
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post('cleanup-orphaned-beers')
  @Roles(UserRole.ADMIN)
  async cleanupOrphanedEventBeers() {
    await this.backupService.cleanupOrphanedEventBeers();
    return { message: 'Cleanup completed successfully' };
  }
}
