import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  FormControlLabel,
  Switch,
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
  RestoreFromTrash as RestoreIcon,
} from '@mui/icons-material';
import { systemService, type SystemStats } from '../../../services/systemService';
import { userService } from '../../../services/userService';
import { useToast } from '../../../hooks/useToast';
import translations from '../../../locales/cs/system.json';
import { MetricCard } from '@demonicka/ui';
import { useFeatureFlag } from '../../../hooks/useFeatureFlag';
import { FeatureFlagKey } from '../../../types/featureFlags';
import type { User } from '@demonicka/shared-types';

const UsersPage: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingTokenFor, setGeneratingTokenFor] = useState<string | null>(null);
  const canShowDeletedUsers = useFeatureFlag(FeatureFlagKey.SHOW_DELETED_USERS);
  const [showDeletedUsers, setShowDeletedUsers] = useState(false);
  const [deletedUsers, setDeletedUsers] = useState<User[]>([]);
  const [isDeletedUsersLoading, setIsDeletedUsersLoading] = useState(false);
  const toast = useToast();
  const isRefreshingRef = useRef(false);

  const loadStats = useCallback(async (isInitial = false) => {
    // Prevent multiple simultaneous calls
    if (isRefreshingRef.current && !isInitial) {
      return;
    }
    
    try {
      if (isInitial) {
        setIsInitialLoading(true);
      } else {
        isRefreshingRef.current = true;
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
        isRefreshingRef.current = false;
        setIsRefreshing(false);
      }
    }
  }, []); // Remove dependencies to prevent infinite loops

  useEffect(() => {
    loadStats(true);
    
    const interval = setInterval(() => {
      loadStats(false);
    }, 30000);

    return () => {
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

  const loadDeletedUsers = useCallback(async () => {
    try {
      setIsDeletedUsersLoading(true);
      const data = await userService.getDeleted();
      setDeletedUsers(data);
    } catch (error) {
      console.error('Failed to load deleted users:', error);
      toast.error('Nepodařilo se načíst smazané uživatele');
    } finally {
      setIsDeletedUsersLoading(false);
    }
  }, [toast]);

  const handleRestoreUser = useCallback(
    async (userId: string) => {
      try {
        await userService.restoreUser(userId);
        toast.success('Uživatel byl obnoven');
        await Promise.all([loadStats(false), loadDeletedUsers()]);
      } catch (error) {
        console.error('Failed to restore user:', error);
        toast.error('Nepodařilo se obnovit uživatele');
      }
    },
    [loadDeletedUsers, loadStats, toast],
  );

  useEffect(() => {
    if (!canShowDeletedUsers) return;
    if (showDeletedUsers) {
      loadDeletedUsers();
    } else {
      setDeletedUsers([]);
    }
  }, [canShowDeletedUsers, showDeletedUsers, loadDeletedUsers]);

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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" fontWeight="bold">
          Uživatelé
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          {canShowDeletedUsers && (
            <FormControlLabel
              control={
                <Switch
                  checked={showDeletedUsers}
                  onChange={(e) => setShowDeletedUsers(e.target.checked)}
                />
              }
              label="Zobrazit smazané"
            />
          )}
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />}
            onClick={() => loadStats(false)}
            disabled={isRefreshing}
          >
            {translations.refresh}
          </Button>
        </Box>
      </Box>

      {stats && (
        <>
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

          {canShowDeletedUsers && showDeletedUsers && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Smazaní uživatelé</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={loadDeletedUsers}
                    disabled={isDeletedUsersLoading}
                    size="small"
                  >
                    Obnovit
                  </Button>
                </Box>

                {isDeletedUsersLoading ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress size={24} />
                  </Box>
                ) : deletedUsers.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Žádní smazaní uživatelé
                  </Typography>
                ) : (
                  <TableContainer sx={{ overflowX: 'auto' }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Uživatel</TableCell>
                          <TableCell>Role</TableCell>
                          <TableCell>Smazáno</TableCell>
                          <TableCell align="right">Akce</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {deletedUsers.map((u) => (
                          <TableRow key={u.id} sx={{ opacity: 0.8 }}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {u.username}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip label={u.role} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {u.deletedAt ? new Date(u.deletedAt).toLocaleString('cs-CZ') : '-'}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Tooltip title="Obnovit">
                                <IconButton
                                  size="small"
                                  onClick={() => handleRestoreUser(u.id)}
                                  sx={{
                                    border: 1,
                                    borderColor: 'success.main',
                                    '&:hover': { bgcolor: 'success.light' },
                                  }}
                                >
                                  <RestoreIcon fontSize="small" sx={{ color: 'success.main' }} />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </Box>
  );
};

export { UsersPage };
