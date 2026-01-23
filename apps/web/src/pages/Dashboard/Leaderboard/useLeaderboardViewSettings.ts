import { useState, useEffect } from 'react';
import { leaderboardViewSettingsService, type LeaderboardViewSettings } from '../../../services/leaderboardViewSettingsService';
import { websocketService } from '../../../services/websocketService';

export const useLeaderboardViewSettings = () => {
  const [settings, setSettings] = useState<LeaderboardViewSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const data = await leaderboardViewSettingsService.getSettings();
        setSettings(data);
      } catch (error) {
        console.error('Failed to load leaderboard view settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();

    // Subscribe to WebSocket updates
    const onSettingsUpdate = (data: LeaderboardViewSettings) => {
      setSettings(data);
    };

    websocketService.subscribe('leaderboard-view-settings:update', onSettingsUpdate);

    // Fallback: Poll for updates every 10 seconds in case WebSocket fails
    const interval = setInterval(loadSettings, 10000);

    return () => {
      websocketService.unsubscribe('leaderboard-view-settings:update', onSettingsUpdate);
      clearInterval(interval);
    };
  }, []);

  return { settings, isLoading };
};
