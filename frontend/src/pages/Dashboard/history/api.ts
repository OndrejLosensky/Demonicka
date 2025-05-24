import axios from 'axios';
import type { LogStats, LogsResponse } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface GetLogsParams {
  level?: string;
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
  eventType?: string;
}

interface CleanupOptions {
  olderThan?: Date;
  levels?: string[];
  eventTypes?: string[];
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
    
    const { data } = await axios.get(`${API_URL}/logs/stats?${params}`, {
      withCredentials: true
    });
    return data;
  },

  cleanup: async (options: CleanupOptions = {}): Promise<{ deletedCount: number }> => {
    const { data } = await axios.post(`${API_URL}/logs/cleanup`, options, {
      withCredentials: true
    });
    return data;
  }
};

export const getLogs = async (params: GetLogsParams = {}): Promise<LogsResponse> => {
  const { data } = await axios.get(`${API_URL}/logs`, {
    params,
    withCredentials: true
  });
  return data;
}; 