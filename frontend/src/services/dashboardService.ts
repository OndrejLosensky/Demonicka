import { api } from './api';
import type { DashboardStats } from '../types/dashboard';
import type { PublicStats } from '../types/public';

export const dashboardService = {
  async getDashboardStats(eventId?: string): Promise<DashboardStats> {
    const response = await api.get('/dashboard', {
      params: { eventId },
    });
    return response.data;
  },

  async getPublicStats(eventId?: string): Promise<PublicStats> {
    const response = await api.get('/dashboard/public', {
      params: { eventId },
    });
    return response.data;
  },
}; 