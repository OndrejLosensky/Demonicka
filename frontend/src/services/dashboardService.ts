import { apiClient as api } from '../utils/apiClient';
import type { DashboardStats } from '../types/dashboard';
import type { PublicStats } from '../types/public';
import type { LeaderboardData } from '../types/leaderboard';
import type { HourlyStats } from '../types/hourlyStats';

export const dashboardService = {
  async getDashboardStats(eventId?: string): Promise<DashboardStats> {
    const response = await api.get('/dashboard/overview', {
      params: { eventId, cb: Date.now() }
    });
    return response.data;
  },

  async getPublicStats(eventId?: string): Promise<PublicStats> {
    const response = await api.get('/dashboard/public', {
      params: { eventId }
    });
    return response.data;
  },

  async getLeaderboard(eventId?: string): Promise<LeaderboardData> {
    const response = await api.get('/dashboard/leaderboard', {
      params: { eventId, cb: Date.now() }
    });
    return response.data;
  },

  async getHourlyStats(eventId: string, date?: string): Promise<HourlyStats[]> {
    const params: { eventId: string; date?: string; cb?: number } = { eventId };
    if (date) {
      params.date = date;
    }
    params.cb = Date.now();
    const response = await api.get('/dashboard/hourly-stats', {
      params
    });
    return response.data;
  },
}; 