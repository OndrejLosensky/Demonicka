import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { leaderboardApi } from './api';
import type { LeaderboardData } from './types';

export const CURRENT_YEAR = new Date().getFullYear();
export const AVAILABLE_YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1];

export const useLeaderboard = () => {
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);

  const { data: stats, isLoading } = useQuery<LeaderboardData>({
    queryKey: ['leaderboard', selectedYear],
    queryFn: () => leaderboardApi.getLeaderboard(selectedYear),
    refetchInterval: 30000,
  });

  return {
    stats,
    isLoading,
    selectedYear,
    setSelectedYear,
    AVAILABLE_YEARS,
  };
}; 