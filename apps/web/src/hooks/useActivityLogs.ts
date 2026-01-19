import { useCallback, useEffect, useState } from 'react';
import type { ActivityEventType, ActivityLogEntry } from '../pages/Dashboard/Activity/activity.types';
import { fetchActivityLogs } from '../pages/Dashboard/Activity/activity.api';

function toLocalDateInputValue(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toDayBoundsIso(dateStr: string): { startIso: string; endIso: string } | null {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split('-').map((v) => Number(v));
  if (!y || !m || !d) return null;
  const start = new Date(y, m - 1, d, 0, 0, 0, 0);
  const end = new Date(y, m - 1, d, 23, 59, 59, 999);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

export function useActivityLogs() {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [selectedEvent, setSelectedEvent] = useState<ActivityEventType | ''>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(() => toLocalDateInputValue(new Date()));
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const bounds = toDayBoundsIso(selectedDate);
      const data = await fetchActivityLogs({
        limit: rowsPerPage,
        offset: page * rowsPerPage,
        eventType: selectedEvent,
        level: selectedLevel || undefined,
        startDate: bounds?.startIso,
        endDate: bounds?.endIso,
        search: debouncedSearch || undefined,
      });
      setLogs(data.logs);
      setTotal(data.total);
    } catch (error) {
      // keep console for now; global axios handler shows toast for server errors
      console.error('Failed to fetch activity logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, rowsPerPage, selectedEvent, selectedLevel, selectedDate, debouncedSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => {
      if (!isLoading) void load();
    }, 5000);
    return () => clearInterval(id);
  }, [autoRefresh, isLoading, load]);

  const changePage = (_: unknown, newPage: number) => setPage(newPage);

  const changeRowsPerPage = (value: number) => {
    setRowsPerPage(value);
    setPage(0);
  };

  const changeEventType = (value: ActivityEventType | '') => {
    setSelectedEvent(value);
    setPage(0);
  };

  const changeLevel = (value: string) => {
    setSelectedLevel(value);
    setPage(0);
  };

  const changeDate = (value: string) => {
    setSelectedDate(value);
    setPage(0);
  };

  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  return {
    logs,
    total,
    isLoading,
    page,
    rowsPerPage,
    selectedEvent,
    selectedLevel,
    selectedDate,
    search,
    autoRefresh,
    reload: load,
    setPage: changePage,
    setRowsPerPage: changeRowsPerPage,
    setSelectedEvent: changeEventType,
    setSelectedLevel: changeLevel,
    setSelectedDate: changeDate,
    setSearch: changeSearch,
    setAutoRefresh,
  };
}

