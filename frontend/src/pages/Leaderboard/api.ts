import type { LeaderboardData } from './types';
import { api } from '../../services/api';

export const leaderboardApi = {
  getLeaderboard: async (eventId?: string): Promise<LeaderboardData> => {
    const params = eventId ? { eventId } : {};
    const response = await api.get('/dashboard/leaderboard', { params });
    return {
      ...response.data,
      updatedAt: new Date().toISOString(),
    };
  }
}; 