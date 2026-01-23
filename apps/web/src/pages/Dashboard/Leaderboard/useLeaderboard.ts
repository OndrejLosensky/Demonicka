import { websocketService } from '../../../services/websocketService';
import { leaderboardApi } from './api';
import { dashboardService } from '../../../services/dashboardService';
import type { LeaderboardData } from './types';
import type { DashboardStats } from '@demonicka/shared-types';
import type { PublicStats } from '../../../types/public';
import { useState, useEffect } from 'react';
import { useActiveEvent } from '../../../contexts/ActiveEventContext';
import { useSelectedEvent } from '../../../contexts/SelectedEventContext';

export const useLeaderboard = () => {
  const [stats, setStats] = useState<LeaderboardData | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [publicStats, setPublicStats] = useState<PublicStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { activeEvent, isActiveEventLoading } = useActiveEvent();
  const { selectedEvent } = useSelectedEvent();
  
  // Use selectedEvent if available, otherwise fall back to activeEvent
  const currentEvent = selectedEvent || activeEvent;

  useEffect(() => {
    const loadLeaderboard = async () => {
      // Only load if we have a current event
      if (!currentEvent?.id) {
        setStats(null);
        setDashboardStats(null);
        setPublicStats(null);
        setIsLoading(false);
        return;
      }

      try {
        // Load both leaderboard and dashboard stats initially
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

    // Subscribe to real-time updates
    const onLeaderboard = (data: LeaderboardData) => {
      console.log('[useLeaderboard] Received leaderboard update via WebSocket', { timestamp: new Date().toISOString() });
      setStats(data);
    };
    const onDashboardStats = (data: { dashboard: DashboardStats; public: PublicStats }) => {
      console.log('[useLeaderboard] Received dashboard stats update via WebSocket', { timestamp: new Date().toISOString() });
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

  // Join event room for real-time updates
  useEffect(() => {
    if (currentEvent?.id) {
      websocketService.joinEvent(currentEvent.id);
      
      return () => {
        websocketService.leaveEvent(currentEvent.id);
      };
    }
  }, [currentEvent?.id]);

  // Fallback refresh every 5 minutes in case WebSocket fails
  useEffect(() => {
    if (!currentEvent?.id) return;

    const interval = setInterval(async () => {
      try {
        // Refresh both leaderboard and dashboard stats
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
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      clearInterval(interval);
    };
  }, [currentEvent?.id]);

  return { stats, dashboardStats, publicStats, isLoading };
}; 