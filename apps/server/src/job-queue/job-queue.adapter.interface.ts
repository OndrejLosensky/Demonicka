/**
 * Queue adapter interface. In-process implementation for v1; swap for Bull/Redis in v3/v4.
 */
export const JOB_QUEUE_ADAPTER = Symbol('JOB_QUEUE_ADAPTER');

export interface IJobQueueAdapter {
  enqueue(jobId: string, type: string, payload: object): Promise<void>;

  /**
   * Optional: drain pending job ids (in-process only). Returns and clears the queue.
   * Used by the worker loop to process jobs. Bull adapter does not implement this.
   */
  drain?(): string[];
}
