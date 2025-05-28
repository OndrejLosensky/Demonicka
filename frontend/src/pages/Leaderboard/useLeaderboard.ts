import { useQuery } from '@tanstack/react-query';
import { leaderboardApi } from './api';
import type { LeaderboardData } from './types';
import { useSelectedEvent } from '../../contexts/SelectedEventContext';

export const useLeaderboard = () => {
  const { selectedEvent } = useSelectedEvent();

  const { data: stats, isLoading } = useQuery<LeaderboardData>({
    queryKey: ['leaderboard', selectedEvent?.id],
    queryFn: () => leaderboardApi.getLeaderboard(selectedEvent?.id),
    refetchInterval: 30000,
  });

  return {
    stats,
    isLoading,
    selectedEvent,
  };
}; 