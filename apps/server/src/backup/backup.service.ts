import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventsService } from '../events/events.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventBeer } from '../events/entities/event-beer.entity';
import { Event } from '../events/entities/event.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir = path.join(process.cwd(), 'data', 'backups');

  constructor(
    private readonly eventsService: EventsService,
    @InjectRepository(EventBeer)
    private readonly eventBeerRepository: Repository<EventBeer>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
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

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(
        this.backupDir,
        `backup-${timestamp}.sqlite`,
      );
      const dbPath =
        process.env.DATABASE_URL ||
        path.join(process.cwd(), 'data', 'database.sqlite');

      // Copy the database file
      fs.copyFileSync(dbPath, backupPath);
      this.logger.log(`Database backup created at ${backupPath}`);

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
      const activeEvents = await this.eventRepository.find({
        where: { isActive: true },
        relations: ['users'],
      });

      let totalCleaned = 0;

      for (const event of activeEvents) {
        const eventUserIds = event.users.map((u) => u.id);

        if (eventUserIds.length === 0) {
          continue;
        }

        // Find event beers from users who are no longer in the event
        const orphanedBeers = await this.eventBeerRepository
          .createQueryBuilder('event_beer')
          .where('event_beer.eventId = :eventId', { eventId: event.id })
          .andWhere('event_beer.userId NOT IN (:...userIds)', {
            userIds: eventUserIds,
          })
          .getMany();

        if (orphanedBeers.length > 0) {
          this.logger.log(
            `Found ${orphanedBeers.length} orphaned beers in event ${event.name} from removed users`,
          );

          // Soft delete the orphaned beers
          for (const beer of orphanedBeers) {
            beer.deletedAt = new Date();
            await this.eventBeerRepository.save(beer);
          }

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
