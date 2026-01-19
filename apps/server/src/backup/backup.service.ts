import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventsService } from '../events/events.service';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir = path.join(process.cwd(), 'data', 'backups');

  constructor(
    private readonly eventsService: EventsService,
    private prisma: PrismaService,
  ) {
    // Ensure backup directory exists
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleBackup() {
    try {
      const activeEvent = await this.eventsService.getActiveEvent();

      if (!activeEvent) {
        this.logger.debug('No active event found, skipping backup');
        return;
      }

      // Note: For PostgreSQL, backups should be done via pg_dump
      // This is a placeholder - actual backup should use pg_dump or similar
      this.logger.log(
        'Backup scheduled (PostgreSQL backups should use pg_dump)',
      );

      // Clean up old backups (older than 6 hours)
      this.cleanupOldBackups();
    } catch (error) {
      this.logger.error('Failed to create backup:', error);
    }
  }

  /**
   * Clean up orphaned event beers from users who are no longer in the event
   */
  async cleanupOrphanedEventBeers(): Promise<void> {
    try {
      this.logger.log('Starting cleanup of orphaned event beers...');

      // Get all active events
      const activeEvents = await this.prisma.event.findMany({
        where: { isActive: true, deletedAt: null },
        include: {
          users: true,
        },
      });

      let totalCleaned = 0;

      for (const event of activeEvents) {
        const eventUserIds = event.users.map((eu) => eu.userId);

        if (eventUserIds.length === 0) {
          continue;
        }

        // Find event beers from users who are no longer in the event
        const orphanedBeers = await this.prisma.eventBeer.findMany({
          where: {
            eventId: event.id,
            userId: { notIn: eventUserIds },
            deletedAt: null,
          },
        });

        if (orphanedBeers.length > 0) {
          this.logger.log(
            `Found ${orphanedBeers.length} orphaned beers in event ${event.name} from removed users`,
          );

          // Soft delete the orphaned beers
          await this.prisma.eventBeer.updateMany({
            where: {
              id: { in: orphanedBeers.map((b) => b.id) },
            },
            data: { deletedAt: new Date() },
          });

          totalCleaned += orphanedBeers.length;
        }
      }

      this.logger.log(
        `Cleanup completed. Total orphaned beers cleaned: ${totalCleaned}`,
      );
    } catch (error) {
      this.logger.error('Failed to cleanup orphaned event beers:', error);
      throw error;
    }
  }

  private cleanupOldBackups() {
    try {
      if (!fs.existsSync(this.backupDir)) {
        return;
      }
      const files = fs.readdirSync(this.backupDir);
      const now = new Date().getTime();
      const sixHoursInMs = 6 * 60 * 60 * 1000;

      files.forEach((file) => {
        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);
        const age = now - stats.mtime.getTime();

        if (age > sixHoursInMs) {
          fs.unlinkSync(filePath);
          this.logger.debug(`Deleted old backup: ${file}`);
        }
      });
    } catch (error) {
      this.logger.error('Failed to cleanup old backups:', error);
    }
  }
}
