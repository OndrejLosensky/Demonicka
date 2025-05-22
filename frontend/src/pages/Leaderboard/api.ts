import axios from 'axios';
import type { LeaderboardData } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const leaderboardApi = {
  getLeaderboard: async (year: number): Promise<LeaderboardData> => {
    const { data } = await axios.get(`${API_URL}/dashboard/leaderboard`, {
      params: { year },
      withCredentials: true
    });
    return data;
  }
}; 