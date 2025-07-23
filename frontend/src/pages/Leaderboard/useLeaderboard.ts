import { websocketService } from '../../services/websocketService';
import type { LeaderboardData } from './types';
import { useState, useEffect } from 'react';

export const useLeaderboard = () => {
  const [stats, setStats] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    websocketService.subscribe('leaderboard:update', (data) => {
      setStats(data);
      setIsLoading(false);
    });

    return () => {
      websocketService.unsubscribe('leaderboard:update', (data) => {
        setStats(data);
      });
    };
  }, []);

  return { stats, isLoading };
}; 