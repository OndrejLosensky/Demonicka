import type { LeaderboardData } from './types';
import { api } from '../../services/api';

export const leaderboardApi = {
  getLeaderboard: async (eventId: string): Promise<LeaderboardData> => {
    if (!eventId) {
      throw new Error('Event ID is required for leaderboard');
    }
    
    const response = await api.get('/dashboard/leaderboard', { params: { eventId } });
    return {
      ...response.data,
      updatedAt: new Date().toISOString(),
    };
  }
}; 