import type { DashboardStats } from '../../types/dashboard';
import { apiClient as api } from '../../utils/apiClient';

export const dashboardApi = {
  getOverview: async (eventId?: string): Promise<DashboardStats> => {
    const params = eventId ? { eventId } : {};
    const response = await api.get('/dashboard/overview', { params });
    return response.data;
  },
}; 