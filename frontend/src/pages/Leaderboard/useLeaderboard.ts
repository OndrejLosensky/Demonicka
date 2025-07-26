import { websocketService } from '../../services/websocketService';
import { leaderboardApi } from './api';
import type { LeaderboardData } from './types';
import { useState, useEffect } from 'react';
import { useActiveEvent } from '../../contexts/ActiveEventContext';

export const useLeaderboard = () => {
  const [stats, setStats] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { activeEvent } = useActiveEvent();

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
    websocketService.subscribe('leaderboard:update', (data) => {
      setStats(data);
    });

    return () => {
      websocketService.unsubscribe('leaderboard:update', (data) => {
        setStats(data);
      });
    };
  }, [activeEvent?.id]);

  return { stats, isLoading };
}; 