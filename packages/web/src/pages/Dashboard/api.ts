import type { DashboardStats } from '@demonicka/shared-types';
import { api } from '../../services/api';

export const dashboardApi = {
  getOverview: async (eventId?: string): Promise<DashboardStats> => {
    const params = eventId ? { eventId } : {};
    const response = await api.get('/dashboard/overview', { params });
    return response.data;
  },
}; 