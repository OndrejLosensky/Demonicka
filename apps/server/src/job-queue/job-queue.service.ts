import { Injectable, Inject, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { JobStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JOB_QUEUE_ADAPTER, IJobQueueAdapter } from './job-queue.adapter.interface';
import { JobHandlerRegistry, type JobLogEntry } from './job-handler.registry';
import { JobsGateway } from './jobs.gateway';

const DEFAULT_STALE_MINUTES = 15;
const STALE_CHECK_INTERVAL_MS = 60_000; // 1 minute

export interface EnqueueOptions {
  type: string;
  payload: object;
  createdByUserId?: string | null;
}

@Injectable()
export class JobQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobQueueService.name);
  private workerRunning = false;
  private readonly POLL_MS = 200;
  private staleCheckInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(JOB_QUEUE_ADAPTER) private readonly adapter: IJobQueueAdapter,
    private readonly handlerRegistry: JobHandlerRegistry,
    private readonly jobsGateway: JobsGateway,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.runRecovery();
    this.startWorker();
    this.startStaleCheck();
  }

  onModuleDestroy(): void {
    if (this.staleCheckInterval) {
      clearInterval(this.staleCheckInterval);
      this.staleCheckInterval = null;
    }
  }

  /**
   * On startup: mark any RUNNING jobs as FAILED (interrupted by restart) and re-queue
   * all QUEUED jobs from DB into the in-memory queue so they get processed.
   */
  async runRecovery(): Promise<{ markedFailed: number; requeued: number }> {
    const markedFailed = await this.markStaleRunningAsFailed(
      'Job interrupted (server restart or process exit).',
      0, // on startup, consider any RUNNING stale
    );
    const requeued = await this.requeueQueuedFromDb();
    if (markedFailed > 0 || requeued > 0) {
      this.logger.log(
        `Recovery: marked ${markedFailed} RUNNING job(s) as failed, requeued ${requeued} QUEUED job(s).`,
      );
    }
    return { markedFailed, requeued };
  }

  /**
   * Mark RUNNING jobs that have been running longer than threshold as FAILED.
   * thresholdMinutes = 0 means all RUNNING (e.g. for startup).
   */
  async markStaleRunningAsFailed(
    errorMessage: string,
    thresholdMinutes: number = this.getStaleMinutes(),
  ): Promise<number> {
    const threshold = new Date(Date.now() - thresholdMinutes * 60 * 1000);
    const stale = await this.prisma.job.findMany({
      where: {
        status: JobStatus.RUNNING,
        ...(thresholdMinutes > 0 ? { startedAt: { lt: threshold } } : {}),
      },
      select: { id: true },
    });
    for (const { id } of stale) {
      await this.prisma.job.update({
        where: { id },
        data: {
          status: JobStatus.FAILED,
          error: errorMessage,
          finishedAt: new Date(),
        },
      });
      this.emitJobUpdate(id);
    }
    return stale.length;
  }

  /**
   * Load all QUEUED jobs from DB and push them into the adapter so the worker picks them up.
   * Used on startup (after restart the in-memory queue is empty) and by manual recover.
   */
  async requeueQueuedFromDb(): Promise<number> {
    const queued = await this.prisma.job.findMany({
      where: { status: JobStatus.QUEUED },
      orderBy: { createdAt: 'asc' },
    });
    for (const job of queued) {
      await this.adapter.enqueue(job.id, job.type, (job.payload as object) ?? {});
    }
    return queued.length;
  }

  private getStaleMinutes(): number {
    const env = process.env.JOB_STALE_MINUTES;
    if (env == null || env === '') return DEFAULT_STALE_MINUTES;
    const n = parseInt(env, 10);
    return Number.isFinite(n) && n >= 0 ? n : DEFAULT_STALE_MINUTES;
  }

  private startStaleCheck(): void {
    const minutes = this.getStaleMinutes();
    if (minutes <= 0) return;
    this.staleCheckInterval = setInterval(() => {
      this.markStaleRunningAsFailed(
        `Job exceeded stale threshold (${minutes} minutes). Marked as failed.`,
        minutes,
      ).then((n) => {
        if (n > 0) this.logger.warn(`Marked ${n} stale RUNNING job(s) as failed.`);
      });
    }, STALE_CHECK_INTERVAL_MS);
  }

  /**
   * Enqueue a job. Creates the Job row and delegates to the queue adapter.
   * Returns the job id for status polling and WebSocket updates.
   */
  async enqueue(options: EnqueueOptions): Promise<string> {
    const { type, payload, createdByUserId } = options;
    if (!this.handlerRegistry.has(type)) {
      throw new Error(`Unknown job type: ${type}`);
    }
    const job = await this.prisma.job.create({
      data: {
        type,
        payload: payload as Prisma.InputJsonValue,
        status: JobStatus.QUEUED,
        createdByUserId: createdByUserId ?? null,
      },
    });
    await this.adapter.enqueue(job.id, type, payload);
    this.logger.log(`Enqueued job ${job.id} (${type})`);
    return job.id;
  }

  /**
   * Get job by id. Used for GET /jobs/:id and permission checks.
   */
  async getJob(id: string) {
    return this.prisma.job.findUnique({
      where: { id },
      include: { createdByUser: { select: { id: true, username: true } } },
    });
  }

  /**
   * Mark a single job as FAILED (e.g. cancel RUNNING or QUEUED). No-op if job is already completed/failed.
   */
  async markJobFailed(
    jobId: string,
    errorMessage: string = 'Job cancelled or marked failed by user.',
  ): Promise<boolean> {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return false;
    if (job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED) {
      return false;
    }
    await this.prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.FAILED,
        error: errorMessage,
        finishedAt: new Date(),
      },
    });
    this.emitJobUpdate(jobId);
    return true;
  }

  /**
   * List jobs for polling/dashboard. Creator sees own; OPERATOR/SUPER_ADMIN see all.
   */
  async listJobs(options: {
    userId: string;
    isAdmin: boolean;
    status?: JobStatus;
    limit?: number;
  }) {
    const { userId, isAdmin, status, limit = 50 } = options;
    const where: Prisma.JobWhereInput = isAdmin ? {} : { createdByUserId: userId };
    if (status) {
      where.status = status;
    }
    return this.prisma.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { createdByUser: { select: { id: true, username: true } } },
    });
  }

  private startWorker(): void {
    const tick = () => {
      if (this.workerRunning) {
        setImmediate(tick);
        return;
      }
      const ids = this.adapter.drain?.() ?? [];
      if (ids.length === 0) {
        setImmediate(tick);
        return;
      }
      this.workerRunning = true;
      Promise.all(ids.map((id) => this.processJob(id)))
        .catch((err) => this.logger.error('Worker processJob error', err))
        .finally(() => {
          this.workerRunning = false;
          setImmediate(tick);
        });
    };
    setImmediate(tick);
  }

  async processJob(jobId: string): Promise<void> {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job || job.status !== JobStatus.QUEUED) {
      return;
    }
    const handler = this.handlerRegistry.get(job.type);
    if (!handler) {
      await this.prisma.job.update({
        where: { id: jobId },
        data: {
          status: JobStatus.FAILED,
          error: `No handler for job type: ${job.type}`,
          finishedAt: new Date(),
        },
      });
      this.emitJobUpdate(jobId);
      return;
    }
    await this.prisma.job.update({
      where: { id: jobId },
      data: { status: JobStatus.RUNNING, startedAt: new Date() },
    });
    const logs: JobLogEntry[] = [];
    const context = {
      appendLog(level: string, message: string) {
        logs.push({
          level,
          message,
          timestamp: new Date().toISOString(),
        });
      },
    };
    try {
      const payload = job.payload as object;
      const result = await handler(payload, jobId, context);
      await this.prisma.job.update({
        where: { id: jobId },
        data: {
          status: JobStatus.COMPLETED,
          result: result as Prisma.InputJsonValue,
          logs: logs.length > 0 ? (logs as unknown as Prisma.InputJsonValue) : undefined,
          finishedAt: new Date(),
        },
      });
      this.logger.log(`Job ${jobId} (${job.type}) completed`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const errorStack = err instanceof Error ? err.stack : undefined;
      this.logger.error(`Job ${jobId} (${job.type}) failed: ${errorMessage}`);
      await this.prisma.job.update({
        where: { id: jobId },
        data: {
          status: JobStatus.FAILED,
          error: errorStack ?? errorMessage,
          logs: logs.length > 0 ? (logs as unknown as Prisma.InputJsonValue) : undefined,
          finishedAt: new Date(),
        },
      });
    }
    this.emitJobUpdate(jobId);
  }

  private async emitJobUpdate(jobId: string): Promise<void> {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        type: true,
        status: true,
        result: true,
        error: true,
        logs: true,
        createdByUserId: true,
      },
    });
    if (job) {
      this.jobsGateway.emitJobUpdate({
        jobId: job.id,
        type: job.type,
        status: job.status,
        result: job.result as Record<string, unknown> | null,
        error: job.error,
        logs: job.logs as JobLogEntry[] | null,
        createdByUserId: job.createdByUserId,
      });
    }
  }
}
