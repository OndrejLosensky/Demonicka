import type { LogStats, LogsResponse } from './types';
import { apiClient as api } from '../../../utils/apiClient';

interface GetLogsParams {
  level?: string;
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
  eventType?: string;
}

export interface CleanupOptions {
  startDate?: Date;
  endDate?: Date;
  levels?: string[];
  eventType?: string;
}

export const historyApi = {
  getStats: async (startDate?: Date, endDate?: Date): Promise<LogStats> => {
    const params = new URLSearchParams();
    if (startDate) {
      params.append('startDate', startDate.toISOString());
    }
    if (endDate) {
      params.append('endDate', endDate.toISOString());
    }
    
    const response = await api.get(`/logs/stats?${params}`);
    return response.data;
  },

  cleanup: async (options: CleanupOptions = {}): Promise<{ deletedCount: number }> => {
    const response = await api.post('/logs/cleanup', options);
    return response.data;
  }
};

export const getLogs = async (params: GetLogsParams = {}): Promise<LogsResponse> => {
  const response = await api.get('/logs', { params });
  return response.data;
}; 