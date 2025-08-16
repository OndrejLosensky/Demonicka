import { websocketService } from '../../services/websocketService';
import { leaderboardApi } from './api';
import type { LeaderboardData } from './types';
import { useState, useEffect } from 'react';
import { useActiveEvent } from '../../contexts/ActiveEventContext';

export const useLeaderboard = () => {
  const [stats, setStats] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { activeEvent, isActiveEventLoading } = useActiveEvent();

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const data = await leaderboardApi.getLeaderboard(activeEvent?.id);
        setStats(data);
      } catch (error) {
        console.error('Failed to load leaderboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLeaderboard();

    // Subscribe to real-time updates
    const onLeaderboard = (data: LeaderboardData) => setStats(data);
    websocketService.subscribe('leaderboard:update', onLeaderboard);

    return () => {
      websocketService.unsubscribe('leaderboard:update', onLeaderboard);
    };
  }, [activeEvent?.id, isActiveEventLoading]);

  return { stats, isLoading };
}; 