import { api } from './api';

export type RunBackupResponse = {
  message: string;
  fileName: string;
};

export const backupService = {
  async run(): Promise<RunBackupResponse> {
    try {
      // Set a 5-minute timeout for backup operations (they can take a while)
      const response = await api.post('/backup/run', {}, {
        timeout: 5 * 60 * 1000, // 5 minutes
      });
      return response.data;
    } catch (error: any) {
      console.error('[BackupService] Error details:', {
        message: error?.message,
        code: error?.code,
        response: error?.response?.status,
        responseData: error?.response?.data,
      });
      throw error;
    }
  },
};

