import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { systemService, type SystemStats } from '../../../services/systemService';
import { userService } from '../../../services/userService';
import { useToast } from '../../../hooks/useToast';
import translations from '../../../locales/cs/system.json';
import { CleanupSection } from './components/CleanupSection';
import { SystemHealthDashboard } from './components/SystemHealthDashboard';
import { usePageTitle } from '../../../hooks/usePageTitle';
import { PageHeader, MetricCard } from '@demonicka/ui';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, Flag as FlagIcon } from '@mui/icons-material';

const SystemPage: React.FC = () => {
  usePageTitle('Systém');
  const navigate = useNavigate();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingTokenFor, setGeneratingTokenFor] = useState<string | null>(null);
  const toast = useToast();

  const loadStats = useCallback(async (isInitial = false) => {
    // Prevent multiple simultaneous calls
    if (isRefreshing && !isInitial) {
      console.log('SystemPage loadStats - already refreshing, skipping');
      return;
    }
    
    try {
      if (isInitial) {
        setIsInitialLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);
      console.log('Making API call to /dashboard/system');
      const data = await systemService.getSystemStats();
      console.log('API response received');
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
    console.log('SystemPage useEffect - setting up interval');
    loadStats(true);
    
    const interval = setInterval(() => {
      console.log('SystemPage interval - refreshing stats');
      loadStats(false);
    }, 30000);

    return () => {
      console.log('SystemPage useEffect cleanup - clearing interval');
      clearInterval(interval);
    };
  }, [loadStats]);

  const handleGenerateToken = async (userId: string) => {
    try {
      setGeneratingTokenFor(userId);
      const response = await userService.generateRegisterToken(userId);
      await navigator.clipboard.writeText(response.token);
      toast.success(translations.toasts.tokenCopied);
      loadStats(false);
    } catch (error) {
      console.error('Failed to generate token:', error);
      toast.error(translations.toasts.tokenGenerationFailed);
    } finally {
      setGeneratingTokenFor(null);
    }
  };

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
    <Box p={3}>
      <PageHeader
        title={translations.title}
        action={
          <Box display="flex" gap={2}>
            <Button 
              variant="contained" 
              startIcon={<SettingsIcon />}
              onClick={() => navigate('/dashboard/system/roles')}
            >
              Role a oprávnění
            </Button>
            <Button 
              variant="contained" 
              startIcon={<FlagIcon />}
              onClick={() => navigate('/dashboard/system/feature-flags')}
            >
              Feature Flags
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
        }
      />
      
      {stats && (
        <Box>
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard title={translations.userStatistics.totalUsers} value={stats.totalUsers} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard title={translations.userStatistics.adminUsers} value={stats.totalAdminUsers} color="error" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard title={translations.userStatistics.completedRegistrations} value={stats.totalCompletedRegistrations} color="success" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard title={translations.userStatistics.twoFactorEnabled} value={stats.total2FAEnabled} color="warning" />
            </Grid>
          </Grid>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {translations.userList.title}
              </Typography>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{translations.userList.columns.username}</TableCell>
                      <TableCell>{translations.userList.columns.role}</TableCell>
                      <TableCell>{translations.userList.columns.twoFactorStatus}</TableCell>
                      <TableCell>{translations.userList.columns.registrationStatus}</TableCell>
                      <TableCell>{translations.userList.columns.lastAdminLogin}</TableCell>
                      <TableCell align="right">{translations.userList.columns.actions}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.users.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {user.username}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={translations.userList.roles[user.role as keyof typeof translations.userList.roles] || user.role}
                            size="small"
                            color={user.role === 'SUPER_ADMIN' ? 'error' : user.role === 'OPERATOR' ? 'warning' : 'primary'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.isTwoFactorEnabled ? translations.userList.twoFactorStatus.enabled : translations.userList.twoFactorStatus.disabled}
                            size="small"
                            color={user.isTwoFactorEnabled ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.isRegistrationComplete ? translations.userList.registrationStatus.complete : translations.userList.registrationStatus.incomplete}
                            size="small"
                            color={user.isRegistrationComplete ? 'success' : 'warning'}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {user.lastAdminLogin ? new Date(user.lastAdminLogin).toLocaleString('cs-CZ') : 'Nikdy'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {!user.isRegistrationComplete && (
                            <Tooltip title={translations.userList.actions.generateToken}>
                              <IconButton
                                size="small"
                                onClick={() => handleGenerateToken(user.id)}
                                disabled={generatingTokenFor === user.id}
                                color="primary"
                              >
                                <CopyIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* System Health Dashboard */}
          <Box mt={4}>
            <SystemHealthDashboard onRefresh={loadStats} />
          </Box>

          {/* Cleanup Section */}
          <Box mt={4}>
            <CleanupSection onRefresh={loadStats} />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export { SystemPage }; 