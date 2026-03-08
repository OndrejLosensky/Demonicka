import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JOB_TYPES } from '../job-queue/job-handler.registry';

export const JOB_CONFIG_KEYS = {
  BACKUP_ENABLED: 'backup.enabled',
  BACKUP_INTERVAL_HOURS: 'backup.intervalHours',
} as const;

@Injectable()
export class JobConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async get<T = unknown>(key: string): Promise<T | null> {
    const row = await this.prisma.jobConfig.findUnique({
      where: { key },
    });
    if (!row) return null;
    return row.value as T;
  }

  async set(
    key: string,
    value: unknown,
    updatedByUserId?: string | null,
  ): Promise<void> {
    await this.prisma.jobConfig.upsert({
      where: { key },
      create: {
        key,
        value: value as object,
        updatedByUserId: updatedByUserId ?? null,
      },
      update: {
        value: value as object,
        updatedByUserId: updatedByUserId ?? null,
      },
    });
  }

  /**
   * Backup enabled: from DB config, fallback to env BACKUP_ENABLED.
   */
  async getBackupEnabled(): Promise<boolean> {
    const fromDb = await this.get<boolean>(JOB_CONFIG_KEYS.BACKUP_ENABLED);
    if (fromDb !== null && typeof fromDb === 'boolean') return fromDb;
    return process.env.BACKUP_ENABLED === 'true';
  }

  /**
   * Backup interval in hours (1, 6, 12, 24). Default 1.
   */
  async getBackupIntervalHours(): Promise<number> {
    const fromDb = await this.get<number>(JOB_CONFIG_KEYS.BACKUP_INTERVAL_HOURS);
    if (fromDb !== null && typeof fromDb === 'number' && fromDb >= 1) {
      return Math.min(24, Math.max(1, Math.floor(fromDb)));
    }
    return 1;
  }

  /**
   * Last time a backup.run job completed successfully (finishedAt). Used to respect interval.
   */
  async getLastBackupFinishedAt(): Promise<Date | null> {
    const job = await this.prisma.job.findFirst({
      where: { type: JOB_TYPES.BACKUP_RUN, status: 'COMPLETED' },
      orderBy: { finishedAt: 'desc' },
      select: { finishedAt: true },
    });
    return job?.finishedAt ?? null;
  }
}
