import { api } from './api';

export type RunBackupResponse = {
  jobId: string;
  status: string;
};

export const backupService = {
  async run(): Promise<RunBackupResponse> {
    const response = await api.post<RunBackupResponse>('/backup/run', {});
    return response.data;
  },
};

