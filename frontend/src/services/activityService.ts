import { api } from './api';
import type { ActivityLog, ActivityLogsResponse, ActivityLogsParams } from '../types/activity';

export const activityService = {
  async getActivityLogs(params: ActivityLogsParams = {}): Promise<ActivityLogsResponse> {
    const response = await api.get('/activity/logs', {
      params: {
        page: params.page || 0,
        limit: params.limit || 25,
        type: params.type,
        userId: params.userId,
        eventId: params.eventId,
        cb: Date.now()
      }
    });
    return response.data;
  },

  async getActivityLog(id: string): Promise<ActivityLog> {
    const response = await api.get(`/activity/logs/${id}`);
    return response.data;
  },

  async getActivityStats(): Promise<{
    totalLogs: number;
    logsToday: number;
    logsThisWeek: number;
    logsThisMonth: number;
  }> {
    const response = await api.get('/activity/stats');
    return response.data;
  }
};
