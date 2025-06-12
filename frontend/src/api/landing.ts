import { api } from '../services/api';
import type { PublicStats } from '../types/public';

export const landingApi = {
  getStats: async (eventId?: string): Promise<PublicStats> => {
    const response = await api.get('/dashboard/public', {
      params: { eventId }
    });
    return response.data;
  },
}; 