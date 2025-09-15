import { apiClient as api } from '../../utils/apiClient';
import type { PublicStats } from '../../types/public';

export const landingApi = {
  getStats: async (eventId?: string): Promise<PublicStats> => {
    const params = eventId ? { eventId } : {};
    const response = await api.get('/dashboard/public', { params });
    return response.data;
  },
}; 