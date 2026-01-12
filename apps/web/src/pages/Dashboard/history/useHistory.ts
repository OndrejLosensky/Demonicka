import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getLogs } from './api';

export const LOG_LEVELS = ['info', 'error', 'warn', 'debug'] as const;
export type LogLevel = typeof LOG_LEVELS[number];

export const useHistory = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [level, setLevel] = useState<LogLevel | ''>('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['logs', page, rowsPerPage, level],
    queryFn: () =>
      getLogs({
        offset: page * rowsPerPage,
        limit: rowsPerPage,
        level: level || undefined,
      }),
  });

  const handlePageChange = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleLevelChange = (newLevel: LogLevel | '') => {
    setLevel(newLevel);
    setPage(0);
  };

  return {
    logs: data?.logs ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    page,
    rowsPerPage,
    level,
    handlePageChange,
    handleRowsPerPageChange,
    handleLevelChange,
    refetch,
  };
}; 