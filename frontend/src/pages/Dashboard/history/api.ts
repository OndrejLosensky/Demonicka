import { api } from '../../../api';

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  service: string;
  event?: string;
  [key: string]: unknown;
}

export interface GetLogsResponse {
  logs: LogEntry[];
  total: number;
}

export interface GetLogsParams {
  level?: string;
  limit?: number;
  offset?: number;
}

export const getLogs = async (params: GetLogsParams = {}): Promise<GetLogsResponse> => {
  const { data } = await api.get<GetLogsResponse>('/api/logs', {
    params,
  });
  return data;
}; 