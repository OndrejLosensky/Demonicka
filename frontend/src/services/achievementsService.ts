import { api } from './api';
import type {
  UserAchievementsResponse,
  Achievement,
  CreateAchievementRequest,
  UpdateAchievementRequest,
} from '../types/achievements';

export const achievementsService = {
  async getMyAchievements(): Promise<UserAchievementsResponse> {
    const response = await api.get('/achievements/my');
    return response.data;
  },

  async checkAchievements(): Promise<void> {
    await api.get('/achievements/check');
  },

  // Admin methods
  async getAllAchievements(): Promise<Achievement[]> {
    const response = await api.get('/achievements');
    return response.data;
  },

  async createAchievement(data: CreateAchievementRequest): Promise<Achievement> {
    const response = await api.post('/achievements', data);
    return response.data;
  },

  async updateAchievement(id: string, data: UpdateAchievementRequest): Promise<Achievement> {
    const response = await api.put(`/achievements/${id}`, data);
    return response.data;
  },

  async deleteAchievement(id: string): Promise<void> {
    await api.delete(`/achievements/${id}`);
  },
}; 