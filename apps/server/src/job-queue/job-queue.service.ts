import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { JobStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JOB_QUEUE_ADAPTER, IJobQueueAdapter } from './job-queue.adapter.interface';
import { JobHandlerRegistry } from './job-handler.registry';
import { JobsGateway } from './jobs.gateway';

export interface EnqueueOptions {
  type: string;
  payload: object;
  createdByUserId?: string | null;
}

@Injectable()
export class JobQueueService implements OnModuleInit {
  private readonly logger = new Logger(JobQueueService.name);
  private workerRunning = false;
  private readonly POLL_MS = 200;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(JOB_QUEUE_ADAPTER) private readonly adapter: IJobQueueAdapter,
    private readonly handlerRegistry: JobHandlerRegistry,
    private readonly jobsGateway: JobsGateway,
  ) {}

  onModuleInit(): void {
    this.startWorker();
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
    try {
      const payload = job.payload as object;
      const result = await handler(payload, jobId);
      await this.prisma.job.update({
        where: { id: jobId },
        data: {
          status: JobStatus.COMPLETED,
          result: result as Prisma.InputJsonValue,
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
        createdByUserId: job.createdByUserId,
      });
    }
  }
}
