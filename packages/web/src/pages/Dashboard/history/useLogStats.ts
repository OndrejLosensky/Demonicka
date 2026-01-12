import { useState, useEffect } from 'react';
import type { LogStats } from './types';
import { historyApi } from './api';

export const useLogStats = () => {
  const [stats, setStats] = useState<LogStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
    endDate: new Date(),
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const data = await historyApi.getStats(dateRange.startDate, dateRange.endDate);
        setStats(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch stats'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [dateRange]);

  return {
    stats,
    isLoading,
    error,
    dateRange,
    setDateRange,
  };
}; 