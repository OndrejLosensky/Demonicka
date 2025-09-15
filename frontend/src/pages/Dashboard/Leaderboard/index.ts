import { websocketService } from '../../../services/websocketService';
import { dashboardService } from '../../../services/dashboardService';
import { useState, useEffect } from 'react';
import { useActiveEvent } from '../../../contexts/ActiveEventContext';
import { useSelectedEvent } from '../../../contexts/SelectedEventContext';
import { apiClient as api } from '../../../utils/apiClient';

// Types
export interface UserLeaderboard {
  id: string;
  username: string;
  beerCount: number;
}

export interface LeaderboardData {
  males: UserLeaderboard[];
  females: UserLeaderboard[];
}

export interface LeaderboardTableProps {
  participants: UserLeaderboard[];
  title: string;
  icon?: React.ReactNode;
}

// API
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

// Hook
export const useLeaderboard = () => {
  const [stats, setStats] = useState<LeaderboardData | null>(null);
  const [dashboardStats, setDashboardStats] = useState<any | null>(null);
  const [publicStats, setPublicStats] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { activeEvent, isActiveEventLoading } = useActiveEvent();
  const { selectedEvent } = useSelectedEvent();
  
  const currentEvent = selectedEvent || activeEvent;

  useEffect(() => {
    const loadLeaderboard = async () => {
      if (!currentEvent?.id) {
        setStats(null);
        setDashboardStats(null);
        setPublicStats(null);
        setIsLoading(false);
        return;
      }

      try {
        const [leaderboardData, dashboardData, publicData] = await Promise.all([
          leaderboardApi.getLeaderboard(currentEvent.id),
          dashboardService.getDashboardStats(currentEvent.id),
          dashboardService.getPublicStats(currentEvent.id)
        ]);
        
        setStats(leaderboardData);
        setDashboardStats(dashboardData);
        setPublicStats(publicData);
      } catch (error) {
        console.error('Failed to load leaderboard data:', error);
        setStats(null);
        setDashboardStats(null);
        setPublicStats(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadLeaderboard();

    // WebSocket subscriptions
    const onLeaderboard = (data: LeaderboardData) => setStats(data);
    const onDashboardStats = (data: { dashboard: any; public: any }) => {
      setDashboardStats(data.dashboard);
      setPublicStats(data.public);
    };

    websocketService.subscribe('leaderboard:update', onLeaderboard);
    websocketService.subscribe('dashboard:stats:update', onDashboardStats);

    return () => {
      websocketService.unsubscribe('leaderboard:update', onLeaderboard);
      websocketService.unsubscribe('dashboard:stats:update', onDashboardStats);
    };
  }, [currentEvent?.id, isActiveEventLoading]);

  // Join event room
  useEffect(() => {
    if (currentEvent?.id) {
      websocketService.joinEvent(currentEvent.id);
      return () => websocketService.leaveEvent(currentEvent.id);
    }
  }, [currentEvent?.id]);

  // Fallback refresh
  useEffect(() => {
    if (!currentEvent?.id) return;

    const interval = setInterval(async () => {
      try {
        const [leaderboardData, dashboardData, publicData] = await Promise.all([
          leaderboardApi.getLeaderboard(currentEvent.id),
          dashboardService.getDashboardStats(currentEvent.id),
          dashboardService.getPublicStats(currentEvent.id)
        ]);
        
        setStats(leaderboardData);
        setDashboardStats(dashboardData);
        setPublicStats(publicData);
      } catch (error) {
        console.error('Leaderboard: Fallback refresh failed:', error);
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [currentEvent?.id]);

  return { stats, dashboardStats, publicStats, isLoading };
};

// Re-export the default component from index.tsx
export { default } from './index.tsx';
