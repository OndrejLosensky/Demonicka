import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Grid,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { systemService, type SystemStats } from '../../../services/systemService';
import { useToast } from '../../../hooks/useToast';
import translations from '../../../locales/cs/system.json';
import { MetricCard } from '@demonicka/ui';
import { useDashboardHeaderSlots } from '../../../contexts/DashboardChromeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { USER_ROLE } from '@demonicka/shared-types';
import { backupService } from '../../../services/backupService';
import { websocketService } from '../../../services/websocketService';
import { jobsService } from '../../../services/jobsService';

const SystemPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExportingSystem, setIsExportingSystem] = useState(false);
  const [isExportingUsers, setIsExportingUsers] = useState(false);
  const [isRunningBackup, setIsRunningBackup] = useState(false);
  const backupJobIdRef = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const isSuperAdmin = user?.role === USER_ROLE.SUPER_ADMIN;

  const loadStats = useCallback(async (isInitial = false) => {
    // Prevent multiple simultaneous calls
    if (isRefreshing && !isInitial) {
      return;
    }
    
    try {
      if (isInitial) {
        setIsInitialLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);
      const data = await systemService.getSystemStats();
      setStats(data);
      setError(null);
    } catch (error) {
      console.error('Failed to load system stats:', error);
      setError(translations.error.loadFailed);
      // Use toast directly instead of depending on it in useCallback
      toast.error(translations.error.loadFailed);
    } finally {
      if (isInitial) {
        setIsInitialLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  }, []); // Remove toast dependency to prevent infinite loops

  useEffect(() => {
    loadStats(true);
    
    const interval = setInterval(() => {
      loadStats(false);
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [loadStats]);

  useEffect(() => {
    const handleJobUpdated = (data: import('../../../services/websocketService').JobUpdatedPayload) => {
      if (data.jobId !== backupJobIdRef.current) return;
      if (data.status === 'COMPLETED') {
        const fileName = data.result?.fileName as string | undefined;
        toast.success(fileName ? `${translations.toasts.backupCompleted}: ${fileName}` : translations.toasts.backupCompleted);
        setIsRunningBackup(false);
        backupJobIdRef.current = null;
      } else if (data.status === 'FAILED') {
        const msg = data.error || translations.toasts.backupFailed;
        toast.error(msg.length > 120 ? `${msg.slice(0, 120)}…` : msg);
        setIsRunningBackup(false);
        backupJobIdRef.current = null;
      }
    };
    websocketService.subscribe('job:updated', handleJobUpdated);
    return () => websocketService.unsubscribe('job:updated', handleJobUpdated);
  }, [toast]);

  useEffect(() => {
    if (!isRunningBackup || !backupJobIdRef.current) return;
    const interval = setInterval(async () => {
      if (!backupJobIdRef.current) return;
      try {
        const job = await jobsService.getJob(backupJobIdRef.current);
        if (job.status === 'COMPLETED') {
          const fileName = job.result?.fileName as string | undefined;
          toast.success(fileName ? `${translations.toasts.backupCompleted}: ${fileName}` : translations.toasts.backupCompleted);
          setIsRunningBackup(false);
          backupJobIdRef.current = null;
        } else if (job.status === 'FAILED') {
          const msg = job.error || translations.toasts.backupFailed;
          toast.error(msg.length > 120 ? `${msg.slice(0, 120)}…` : msg);
          setIsRunningBackup(false);
          backupJobIdRef.current = null;
        }
      } catch {
        // ignore poll errors
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isRunningBackup, toast]);

  const handleRunBackup = useCallback(async () => {
    try {
      setIsRunningBackup(true);
      const res = await backupService.run();
      backupJobIdRef.current = res.jobId;
      if (res.status !== 'queued') {
        setIsRunningBackup(false);
        backupJobIdRef.current = null;
      }
    } catch (err) {
      console.error('Failed to run backup:', err);
      toast.error(translations.toasts.backupFailed);
      setIsRunningBackup(false);
      backupJobIdRef.current = null;
    }
  }, [toast]);

  const handleExportSystemExcel = useCallback(async () => {
    try {
      setIsExportingSystem(true);
      const { blob, filename } = await systemService.downloadSystemExcel();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename ?? 'system_export.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Export stažen');
    } catch (err) {
      console.error('System export failed', err);
      toast.error('Nepodařilo se stáhnout export');
    } finally {
      setIsExportingSystem(false);
    }
  }, [toast]);

  const handleExportUsersExcel = useCallback(async () => {
    try {
      setIsExportingUsers(true);
      const { blob, filename } = await systemService.downloadUsersExcel();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename ?? 'users_export.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Export stažen');
    } catch (err) {
      console.error('Users export failed', err);
      toast.error('Nepodařilo se stáhnout export');
    } finally {
      setIsExportingUsers(false);
    }
  }, [toast]);

  const headerAction = useMemo(
    () => (
      <Box display="flex" gap={2}>
        {isSuperAdmin && (
          <>
            <Button 
              variant="outlined" 
              startIcon={<DownloadIcon />}
              onClick={handleExportSystemExcel}
              disabled={isExportingSystem}
            >
              {isExportingSystem ? 'Exportuji…' : 'Exportovat systém (Excel)'}
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<DownloadIcon />}
              onClick={handleExportUsersExcel}
              disabled={isExportingUsers}
            >
              {isExportingUsers ? 'Exportuji…' : 'Exportovat uživatele (Excel)'}
            </Button>
          </>
        )}
        <Button
          variant="outlined"
          startIcon={<CloudUploadIcon />}
          onClick={handleRunBackup}
          disabled={isRunningBackup}
        >
          {isRunningBackup ? translations.backup.running : translations.backup.runButton}
        </Button>
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon />}
          onClick={() => loadStats(false)}
          disabled={isRefreshing}
        >
          {translations.refresh}
        </Button>
      </Box>
    ),
    [loadStats, isRefreshing, isSuperAdmin, isExportingSystem, isExportingUsers, isRunningBackup, handleExportSystemExcel, handleExportUsersExcel, handleRunBackup],
  );

  useDashboardHeaderSlots({
    action: headerAction,
  });

  if (isInitialLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !stats) {
    return (
      <Box textAlign="center" p={4}>
        <Typography color="error" variant="h6" gutterBottom>
          {error}
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => loadStats(true)}
          sx={{ mt: 2 }}
        >
          {translations.error.retry}
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {stats && (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard title={translations.userStatistics.totalUsers} value={stats.totalUsers} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard title={translations.userStatistics.adminUsers} value={stats.totalOperatorUsers} color="error" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard title={translations.userStatistics.completedRegistrations} value={stats.totalCompletedRegistrations} color="success" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard title={translations.userStatistics.twoFactorEnabled} value={stats.total2FAEnabled} color="warning" />
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export { SystemPage }; 