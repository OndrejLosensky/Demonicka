import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { JobQueueService } from '../job-queue/job-queue.service';
import { JobConfigService } from '../job-config/job-config.service';
import { JOB_TYPES } from '../job-queue/job-handler.registry';
import {
  STORAGE_SERVICE,
  type IStorageService,
} from '../storage/storage.interface';
import * as fs from 'fs';
import * as path from 'path';
import { spawn, spawnSync } from 'child_process';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';

const BACKUP_S3_PREFIX = 'demonicka/backups';

/** Retention days for S3 backups (configurable in code only for now). */
export const BACKUP_RETENTION_DAYS = 7;

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private backupDir: string;

  constructor(
    private prisma: PrismaService,
    private readonly jobQueueService: JobQueueService,
    private readonly jobConfigService: JobConfigService,
    @Inject(STORAGE_SERVICE) private readonly storage: IStorageService,
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
    const enabled = await this.jobConfigService.getBackupEnabled();
    if (!enabled) {
      return;
    }
    const intervalHours = await this.jobConfigService.getBackupIntervalHours();
    const lastFinishedAt = await this.jobConfigService.getLastBackupFinishedAt();
    if (lastFinishedAt) {
      const elapsedMs = Date.now() - lastFinishedAt.getTime();
      const intervalMs = intervalHours * 60 * 60 * 1000;
      if (elapsedMs < intervalMs) {
        return;
      }
    }
    try {
      await this.jobQueueService.enqueue({
        type: JOB_TYPES.BACKUP_RUN,
        payload: { trigger: 'cron' },
        createdByUserId: null,
      });
    } catch (error) {
      this.logger.error('Failed to enqueue backup job:', error);
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

    // Full database dump; filename is db + timestamp only (no event label to avoid confusion)
    const fileName = `demonicka_${dbName}_${ts}.sql.gz`;
    const backupPath = path.join(this.backupDir, fileName);

    this.logger.log(`Creating backup: ${backupPath}`);
    await this.pgDumpToGzipFile(databaseUrl, backupPath);

    const fileSize = fs.statSync(backupPath).size;
    this.logger.log(`Backup completed: ${fileName} (${fileSize} bytes)`);

    const monthFolder =
      now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    const s3Key = `${BACKUP_S3_PREFIX}/${monthFolder}/${fileName}`;
    const buffer = fs.readFileSync(backupPath);
    await this.storage.upload(buffer, s3Key, 'application/gzip');
    this.logger.log(`Backup uploaded to S3: ${s3Key}`);
    try {
      fs.unlinkSync(backupPath);
    } catch (err) {
      this.logger.warn(
        'Could not remove local backup file after S3 upload',
        err,
      );
    }

    // Cleanup old local backups if retention is configured (only affects local leftovers)
    const retentionDays = Number(process.env.BACKUP_RETENTION_DAYS ?? 0);
    if (Number.isFinite(retentionDays) && retentionDays > 0) {
      this.cleanupOldBackups(retentionDays);
    }

    return { fileName };
  }

  /**
   * List all backup object keys in S3 under the backup prefix.
   */
  async listBackupKeysInS3(): Promise<
    Array<{ key: string; lastModified: Date; size?: number }>
  > {
    return this.storage.listObjects(BACKUP_S3_PREFIX);
  }

  /**
   * Verify backups in S3: list count and optionally validate the latest object.
   */
  async verifyBackupsInS3(): Promise<{
    totalCount: number;
    latestKey?: string;
    verified: boolean;
  }> {
    const keys = await this.listBackupKeysInS3();
    const totalCount = keys.length;
    if (totalCount === 0) {
      return { totalCount, verified: false };
    }
    const sorted = [...keys].sort(
      (a, b) => b.lastModified.getTime() - a.lastModified.getTime(),
    );
    const latest = sorted[0];
    let verified = false;
    if (latest?.key) {
      try {
        const { stream } = await this.storage.getObjectStream(latest.key);
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
          chunks.push(Buffer.from(chunk));
          if (chunks.reduce((s, c) => s + c.length, 0) >= 1024) break;
        }
        verified = chunks.length > 0 && chunks.reduce((s, c) => s + c.length, 0) > 0;
      } catch {
        verified = false;
      }
    }
    return {
      totalCount,
      latestKey: latest?.key,
      verified,
    };
  }

  /**
   * Delete S3 backup objects older than retentionDays.
   */
  async deleteOldBackupsInS3(
    retentionDays: number,
  ): Promise<{ deletedCount: number; deletedKeys: string[] }> {
    const keys = await this.listBackupKeysInS3();
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    const toDelete = keys.filter((k) => k.lastModified.getTime() < cutoff);
    const deletedKeys: string[] = [];
    for (const { key } of toDelete) {
      await this.storage.delete(key);
      deletedKeys.push(key);
    }
    return { deletedCount: deletedKeys.length, deletedKeys };
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
            this.backupDir = fallbackDir;
            this.logger.log(`Using backup directory: ${fallbackDir}`);
          } catch {
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

  private cleanupOldBackups(retentionDays: number): void {
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

  private getPgDumpPath(): string {
    if (process.env.BACKUP_PG_DUMP_PATH || process.env.PG_DUMP_PATH) {
      return process.env.BACKUP_PG_DUMP_PATH || process.env.PG_DUMP_PATH!;
    }
    const candidates = [
      '/opt/homebrew/opt/postgresql@17/bin/pg_dump',
      '/usr/local/opt/postgresql@17/bin/pg_dump',
      '/opt/homebrew/opt/libpq/bin/pg_dump',
      '/usr/local/opt/libpq/bin/pg_dump',
    ];
    for (const p of candidates) {
      const exists = fs.existsSync(p);
      this.logger.log(`pg_dump candidate ${p} exists=${exists}`);
      if (exists) {
        this.logger.log(`Using pg_dump: ${p}`);
        return p;
      }
    }
    this.logger.warn(
      'No pg_dump 17 path found, falling back to PATH (may cause version mismatch)',
    );
    return 'pg_dump';
  }

  private getPgDumpVersion(bin: string): number {
    try {
      const result = spawnSync(bin, ['--version'], {
        encoding: 'utf8',
        timeout: 5000,
      });
      const out = result.stdout?.trim() || result.stderr?.trim() || '';
      const match = out.match(/pg_dump \(PostgreSQL\) (\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    } catch {
      return 0;
    }
  }

  private async pgDumpToGzipFile(databaseUrl: string, outputPath: string) {
    const pgDumpBin = this.getPgDumpPath();
    const version = this.getPgDumpVersion(pgDumpBin);
    this.logger.log(`Starting pg_dump (version ${version}): ${outputPath}`);
    if (version > 0 && version < 17) {
      throw new Error(
        `pg_dump version ${version} is too old (server is 17.x). ` +
          `Resolved binary: ${pgDumpBin}. ` +
          `Install PostgreSQL 17 and set BACKUP_PG_DUMP_PATH to its pg_dump, or fix PATH so pg_dump 17 is found.`,
      );
    }

    const args = [
      databaseUrl,
      '--clean',
      '--if-exists',
      '--no-owner',
      '--no-privileges',
    ];

    const child = spawn(pgDumpBin, args, {
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';

    child.on('error', (err) => {
      this.logger.error(`pg_dump spawn error: ${err.message}`);
      throw err;
    });

    child.stderr?.on('data', (d: Buffer | string) => {
      stderr += String(d);
    });

    const gzip = createGzip({ level: 9 });
    const out = fs.createWriteStream(outputPath);

    if (!child.stdout) {
      throw new Error('pg_dump stdout is not available');
    }
    await pipeline(child.stdout, gzip, out);

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
}
