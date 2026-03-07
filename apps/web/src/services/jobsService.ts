import { api } from './api';

export type JobStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export type JobResponse = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  status: JobStatus;
  result: Record<string, unknown> | null;
  error: string | null;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  createdByUser?: { id: string; username: string | null } | null;
};

export const jobsService = {
  async getJob(id: string): Promise<JobResponse> {
    const response = await api.get<JobResponse>(`/jobs/${id}`);
    return response.data;
  },

  async list(params?: { status?: JobStatus; limit?: number }): Promise<JobResponse[]> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.limit != null) searchParams.set('limit', String(params.limit));
    const query = searchParams.toString();
    const response = await api.get<JobResponse[]>(`/jobs${query ? `?${query}` : ''}`);
    return response.data;
  },

  /** Admin: mark stale RUNNING as failed and re-queue QUEUED jobs. */
  async recover(): Promise<{ markedFailed: number; requeued: number }> {
    const response = await api.post<{ markedFailed: number; requeued: number }>(
      '/jobs/actions/recover',
    );
    return response.data;
  },

  /** Cancel a QUEUED or RUNNING job (mark as FAILED). */
  async cancel(id: string, message?: string): Promise<{ cancelled: boolean }> {
    const response = await api.post<{ cancelled: boolean }>(`/jobs/${id}/cancel`, {
      message: message ?? undefined,
    });
    return response.data;
  },
};
