import { api } from './api';

export interface LeaderboardViewSettings {
  id: string;
  autoSwitchEnabled: boolean;
  currentView: 'LEADERBOARD' | 'BEER_PONG' | 'AUTO';
  switchIntervalSeconds: number;
  selectedBeerPongEventId: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateLeaderboardViewSettingsDto {
  autoSwitchEnabled?: boolean;
  currentView?: 'LEADERBOARD' | 'BEER_PONG' | 'AUTO';
  switchIntervalSeconds?: number;
  selectedBeerPongEventId?: string | null;
}

export const leaderboardViewSettingsService = {
  /**
   * Get current leaderboard view settings
   */
  async getSettings(): Promise<LeaderboardViewSettings> {
    const response = await api.get('/leaderboard-view-settings');
    return response.data;
  },

  /**
   * Update leaderboard view settings
   */
  async updateSettings(data: UpdateLeaderboardViewSettingsDto): Promise<LeaderboardViewSettings> {
    const response = await api.put('/leaderboard-view-settings', data);
    return response.data;
  },
};
