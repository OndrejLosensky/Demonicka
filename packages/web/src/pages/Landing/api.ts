import { api } from '../../services/api';
import type { PublicStats } from '../../types/public';

export const landingApi = {
  getStats: async (eventId?: string): Promise<PublicStats> => {
    const params = eventId ? { eventId } : {};
    const response = await api.get('/dashboard/public', { params });
    return response.data;
  },
}; 