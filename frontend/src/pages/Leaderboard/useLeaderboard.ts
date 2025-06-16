import { useState, useEffect } from 'react';
import { socket } from '../../services/websocketService';
import { leaderboardApi } from './api';
import type { LeaderboardData } from './types';
import { useActiveEvent } from '../../contexts/ActiveEventContext';

export const useLeaderboard = () => {
  const [stats, setStats] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { activeEvent } = useActiveEvent();

  const fetchLeaderboard = async () => {
    try {
      const data = await leaderboardApi.getLeaderboard(activeEvent?.id);
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [activeEvent?.id]);

  useEffect(() => {
    // Listen for leaderboard updates
    socket.on('leaderboardUpdate', (data: LeaderboardData) => {
      if (data && data.males && data.females) {
        setStats(data);
      } else {
        console.error('Received invalid leaderboard data:', data);
        // Fetch fresh data if the WebSocket update was invalid
        fetchLeaderboard();
      }
    });

    return () => {
      socket.off('leaderboardUpdate');
    };
  }, []);

  return {
    stats,
    isLoading,
    fetchLeaderboard,
  };
}; 