import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventsService } from '../events/events.service';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private backupDir: string;
  private isRunning = false;

  constructor(
    private readonly eventsService: EventsService,
    private prisma: PrismaService,
  ) {
    // Determine backup directory
    if (process.env.BACKUP_DIR) {
      this.backupDir = path.join(process.env.BACKUP_DIR, 'database');
    } else {
      // Default: use apps/server/data/backups/database
      // In production, can use /var/backups/demonicka
      const isProduction = process.env.NODE_ENV === 'production';
      const baseDir = isProduction
        ? '/var/backups/demonicka'
        : path.join(process.cwd(), 'apps', 'server', 'data', 'backups');
      this.backupDir = path.join(baseDir, 'database');
    }

    // Ensure backup directory exists
    this.ensureBackupDir();
    this.logger.log(`Backups will be saved to: ${this.backupDir}`);
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleBackup() {
    // Opt-in for production
    if (process.env.BACKUP_ENABLED !== 'true') {
      return;
    }
    if (this.isRunning) {
      this.logger.warn('Backup already running, skipping this tick');
      return;
    }
    this.isRunning = true;
    try {
      await this.runPgDumpAndUpload({ trigger: 'cron' });
    } catch (error) {
      this.logger.error('Failed to create backup:', error);
    } finally {
      this.isRunning = false;
    }
  }

  async runPgDumpAndUpload(params: {
    trigger: 'cron' | 'manual';
    actorUserId?: string;
  }): Promise<{ fileName: string }> {
    this.logger.log(`Starting backup (${params.trigger})`);

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      this.logger.error('DATABASE_URL is not set');
      throw new Error('DATABASE_URL is not set');
    }

    const now = new Date();
    const ts = now.toISOString().replace(/[:.]/g, '-');

    let dbName = 'database';
    try {
      const u = new URL(databaseUrl);
      dbName = (u.pathname.split('/').pop() || 'database').replace(/\W+/g, '_');
    } catch {
      // ignore
    }

    // Include active event name if available (but never gate backups on it)
    let eventSuffix = '';
    try {
      const activeEvent = await this.eventsService.getActiveEvent();
      if (activeEvent?.name) {
        eventSuffix =
          '_' +
          activeEvent.name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9_-]/g, '')
            .slice(0, 40);
      }
    } catch {
      // ignore
    }

    const fileName = `demonicka_${dbName}${eventSuffix}_${ts}.sql.gz`;
    const backupPath = path.join(this.backupDir, fileName);

    this.logger.log(`Creating backup: ${backupPath}`);
    await this.pgDumpToGzipFile(databaseUrl, backupPath);

    const fileSize = fs.statSync(backupPath).size;
    this.logger.log(`Backup completed: ${fileName} (${fileSize} bytes)`);

    // Cleanup old backups if retention is configured
    const retentionDays = Number(process.env.BACKUP_RETENTION_DAYS ?? 0);
    if (Number.isFinite(retentionDays) && retentionDays > 0) {
      await this.cleanupOldBackups(retentionDays);
    }

    return { fileName };
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

  private ensureBackupDir(): void {
    if (!fs.existsSync(this.backupDir)) {
      try {
        fs.mkdirSync(this.backupDir, { recursive: true });
        this.logger.log(`Created backup directory: ${this.backupDir}`);
      } catch (error) {
        const err = error as NodeJS.ErrnoException;
        // If permission denied and in development, use project directory instead
        if (err.code === 'EACCES' && process.env.NODE_ENV !== 'production') {
          const fallbackDir = path.join(
            process.cwd(),
            'apps',
            'server',
            'data',
            'backups',
            'database',
          );
          this.logger.warn(
            `Cannot write to ${this.backupDir}, using fallback: ${fallbackDir}`,
          );
          try {
            if (!fs.existsSync(fallbackDir)) {
              fs.mkdirSync(fallbackDir, { recursive: true });
            }
            // Update the backupDir property
            (this as any).backupDir = fallbackDir;
            this.logger.log(`Using backup directory: ${fallbackDir}`);
          } catch (fallbackError) {
            throw new Error(
              `Cannot create backup directory. Please set BACKUP_DIR to a writable path or remove it to use the default.`,
            );
          }
        } else {
          throw error;
        }
      }
    }
  }

  private async cleanupOldBackups(retentionDays: number): Promise<void> {
    try {
      const files = fs.readdirSync(this.backupDir);
      const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

      for (const file of files) {
        if (!file.endsWith('.sql.gz')) continue;

        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtimeMs < cutoff) {
          fs.unlinkSync(filePath);
          this.logger.log(`Deleted old backup: ${file}`);
        }
      }
    } catch (error) {
      this.logger.warn('Failed to cleanup old backups', error);
    }
  }

  private async pgDumpToGzipFile(databaseUrl: string, outputPath: string) {
    this.logger.log(`Starting pg_dump: ${outputPath}`);
    
    const args = [
      databaseUrl,
      '--clean',
      '--if-exists',
      '--no-owner',
      '--no-privileges',
    ];

    const child = spawn('pg_dump', args, {
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';
    let stdoutBytes = 0;
    
    child.on('error', (err) => {
      this.logger.error(`pg_dump spawn error: ${err.message}`);
      throw err;
    });
    
    child.stderr?.on('data', (d) => {
      stderr += String(d);
    });

    child.stdout?.on('data', (d) => {
      stdoutBytes += d.length;
    });

    const gzip = createGzip({ level: 9 });
    const out = fs.createWriteStream(outputPath);

    await pipeline(child.stdout!, gzip, out);

    // Wait for process to exit with timeout
    const exitCode: number = await Promise.race([
      new Promise<number>((resolve, reject) => {
        if (child.exitCode !== null) {
          resolve(child.exitCode);
          return;
        }
        child.once('error', reject);
        child.once('close', (code) => resolve(code ?? 0));
      }),
      new Promise<number>((resolve) => {
        setTimeout(() => resolve(0), 5000);
      }),
    ]);

    // Verify output file
    if (!fs.existsSync(outputPath)) {
      throw new Error(`Output file was not created: ${outputPath}`);
    }

    const fileSize = fs.statSync(outputPath).size;
    if (fileSize === 0) {
      throw new Error(`Output file is empty: ${outputPath}`);
    }

    if (exitCode !== 0 && stderr) {
      this.logger.warn(`pg_dump exited with code ${exitCode}, but file exists`);
      throw new Error(`pg_dump failed (code ${exitCode}): ${stderr}`);
    }

    this.logger.log(`pg_dump completed: ${fileSize} bytes`);
  }

  // Note: no local retention (tmp-only). Keep local by setting BACKUP_KEEP_LOCAL=true

}
