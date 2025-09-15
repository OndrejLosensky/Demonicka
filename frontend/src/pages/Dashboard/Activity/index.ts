import { useState, useEffect, useCallback } from 'react';
import type { SelectChangeEvent } from '@mui/material';
import { activityService } from '../../../services/activityService';
import type { ActivityLog } from '../../../types/activity';

// Types
export interface UseActivityReturn {
  activityLogs: ActivityLog[];
  loading: boolean;
  page: number;
  rowsPerPage: number;
  totalCount: number;
  filterType: string;
  handleChangePage: (event: unknown, newPage: number) => void;
  handleChangeRowsPerPage: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleFilterChange: (event: SelectChangeEvent) => void;
  getActionIcon: (action: string) => string;
  getActionColor: (action: string) => string;
  formatActionText: (log: ActivityLog) => string;
}

// Hook
export const useActivity = (): UseActivityReturn => {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [filterType, setFilterType] = useState<string>('all');

  const loadActivityLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await activityService.getActivityLogs({
        page,
        limit: rowsPerPage,
        type: filterType === 'all' ? undefined : filterType,
      });
      
      setActivityLogs(response.data);
      setTotalCount(response.total);
    } catch (error) {
      console.error('Failed to load activity logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, rowsPerPage, filterType]);

  useEffect(() => {
    loadActivityLogs();
  }, [loadActivityLogs]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (event: SelectChangeEvent) => {
    setFilterType(event.target.value);
    setPage(0);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'USER_LOGIN': return '🔐';
      case 'USER_LOGOUT': return '🚪';
      case 'BEER_ADDED': return '🍺';
      case 'BARREL_ADDED': return '🛢️';
      case 'BARREL_FINISHED': return '✅';
      case 'USER_CREATED': return '👤';
      case 'EVENT_CREATED': return '📅';
      case 'EVENT_ACTIVATED': return '▶️';
      case 'EVENT_DEACTIVATED': return '⏸️';
      default: return '📝';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'USER_LOGIN': return 'success';
      case 'USER_LOGOUT': return 'default';
      case 'BEER_ADDED': return 'primary';
      case 'BARREL_ADDED': return 'warning';
      case 'BARREL_FINISHED': return 'success';
      case 'USER_CREATED': return 'info';
      case 'EVENT_CREATED': return 'secondary';
      case 'EVENT_ACTIVATED': return 'success';
      case 'EVENT_DEACTIVATED': return 'warning';
      default: return 'default';
    }
  };

  const formatActionText = (log: ActivityLog) => {
    switch (log.action) {
      case 'USER_LOGIN': return `${log.userName} se přihlásil`;
      case 'USER_LOGOUT': return `${log.userName} se odhlásil`;
      case 'BEER_ADDED': return `${log.userName} přidal pivo`;
      case 'BARREL_ADDED': return `${log.userName} přidal sud`;
      case 'BARREL_FINISHED': return `${log.userName} dokončil sud`;
      case 'USER_CREATED': return `${log.userName} vytvořil uživatele`;
      case 'EVENT_CREATED': return `${log.userName} vytvořil událost`;
      case 'EVENT_ACTIVATED': return `${log.userName} aktivoval událost`;
      case 'EVENT_DEACTIVATED': return `${log.userName} deaktivoval událost`;
      default: return `${log.userName} provedl akci: ${log.action}`;
    }
  };

  return {
    activityLogs,
    loading,
    page,
    rowsPerPage,
    totalCount,
    filterType,
    handleChangePage,
    handleChangeRowsPerPage,
    handleFilterChange,
    getActionIcon,
    getActionColor,
    formatActionText,
  };
};
