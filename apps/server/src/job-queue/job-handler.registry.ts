import { Injectable } from '@nestjs/common';
import { IJobQueueAdapter } from './job-queue.adapter.interface';

const JOB_TYPES = {
  BACKUP_RUN: 'backup.run',
  CLEANUP_SYSTEM: 'cleanup.system',
  CLEANUP_ACTIVE_EVENT: 'cleanup.activeEvent',
  CLEAR_ALL_LOGS: 'clearAllLogs',
  ACHIEVEMENTS_CHECK: 'achievements.check',
} as const;

export type JobType = (typeof JOB_TYPES)[keyof typeof JOB_TYPES];

export interface JobLogEntry {
  level: string;
  message: string;
  timestamp: string;
}

export interface JobContext {
  appendLog(level: string, message: string): void;
}

export type JobHandler<T = object> = (
  payload: T,
  jobId: string,
  context: JobContext,
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
