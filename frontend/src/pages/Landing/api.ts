import { api } from '../../services/api';
import type { PublicStats } from '../../types/public-stats';

export const landingApi = {
  getStats: async (): Promise<PublicStats> => {
    const response = await api.get('/dashboard/public');
    return response.data;
  },
}; 