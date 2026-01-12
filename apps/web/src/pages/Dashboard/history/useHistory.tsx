import { useState, useEffect, useCallback } from 'react';
import { getLogs } from './api';
import type { LogEntry } from './types';

export const LOG_LEVELS = ['info', 'warn', 'error', 'debug'] as const;

export const useHistory = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [level, setLevel] = useState<string>('');

  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getLogs({
        offset: page * rowsPerPage,
        limit: rowsPerPage,
        level: level || undefined,
      });
      setLogs(response.logs);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, rowsPerPage, level]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handlePageChange = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleLevelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLevel(event.target.value);
    setPage(0);
  };

  return {
    logs,
    total,
    isLoading,
    page,
    rowsPerPage,
    level,
    handlePageChange,
    handleRowsPerPageChange,
    handleLevelChange,
    refetch: fetchLogs,
  } as const;
}; 