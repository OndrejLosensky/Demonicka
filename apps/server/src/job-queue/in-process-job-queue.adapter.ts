import { Injectable } from '@nestjs/common';
import { IJobQueueAdapter } from './job-queue.adapter.interface';

@Injectable()
export class InProcessJobQueueAdapter implements IJobQueueAdapter {
  private readonly queue: string[] = [];

  async enqueue(jobId: string, _type: string, _payload: object): Promise<void> {
    this.queue.push(jobId);
  }

  drain(): string[] {
    const ids = this.queue.splice(0, this.queue.length);
    return ids;
  }
}
