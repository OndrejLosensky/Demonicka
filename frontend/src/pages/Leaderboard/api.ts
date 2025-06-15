import type { UserLeaderboard } from './types';
import { api } from '../../services/api';

export const leaderboardApi = {
  getLeaderboard: async (eventId?: string): Promise<UserLeaderboard[]> => {
    const params = eventId ? { eventId } : {};
    const response = await api.get('/dashboard/leaderboard', { params });
    return response.data;
  }
}; 