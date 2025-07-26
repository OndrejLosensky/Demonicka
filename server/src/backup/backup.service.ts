import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventsService } from '../events/events.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir = path.join(process.cwd(), 'data', 'backups');

  constructor(private readonly eventsService: EventsService) {
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

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(this.backupDir, `backup-${timestamp}.sqlite`);
      const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'database.sqlite');

      // Copy the database file
      fs.copyFileSync(dbPath, backupPath);
      this.logger.log(`Database backup created at ${backupPath}`);

      // Clean up old backups (older than 6 hours)
      this.cleanupOldBackups();
    } catch (error) {
      this.logger.error('Failed to create backup:', error);
    }
  }

  private cleanupOldBackups() {
    try {
      const files = fs.readdirSync(this.backupDir);
      const now = new Date().getTime();
      const sixHoursInMs = 6 * 60 * 60 * 1000;

      files.forEach(file => {
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