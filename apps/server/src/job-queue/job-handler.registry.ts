import { Injectable } from '@nestjs/common';
import { IJobQueueAdapter } from './job-queue.adapter.interface';

const JOB_TYPES = {
  BACKUP_RUN: 'backup.run',
} as const;

export type JobType = (typeof JOB_TYPES)[keyof typeof JOB_TYPES];

export type JobHandler<T = object> = (
  payload: T,
  jobId: string,
) => Promise<Record<string, unknown>>;

@Injectable()
export class JobHandlerRegistry {
  private handlers = new Map<string, JobHandler>();

  register(type: string, handler: JobHandler): void {
    if (this.handlers.has(type)) {
      throw new Error(`Job handler already registered for type: ${type}`);
    }
    this.handlers.set(type, handler);
  }

  get(type: string): JobHandler | undefined {
    return this.handlers.get(type);
  }

  has(type: string): boolean {
    return this.handlers.has(type);
  }
}

export { JOB_TYPES };
