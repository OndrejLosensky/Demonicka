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

const SystemPage: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingTokenFor, setGeneratingTokenFor] = useState<string | null>(null);
  const toast = useToast();

  const loadStats = useCallback(async (isInitial = false) => {
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
      toast.error(translations.error.loadFailed);
    } finally {
      if (isInitial) {
        setIsInitialLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    loadStats(true);
    
    const interval = setInterval(() => {
      loadStats(false);
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">{translations.title}</Typography>
        <Button 
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => loadStats(false)}
          disabled={isRefreshing}
        >
          {translations.refresh}
        </Button>
      </Box>
      
      {stats && (
        <Box>
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {translations.userStatistics.title}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center" p={2} bgcolor="grey.50" borderRadius={1}>
                        <Typography variant="h4" color="primary" fontWeight="bold">
                          {stats.totalUsers}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {translations.userStatistics.totalUsers}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center" p={2} bgcolor="grey.50" borderRadius={1}>
                        <Typography variant="h4" color="error" fontWeight="bold">
                          {stats.totalAdminUsers}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {translations.userStatistics.adminUsers}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center" p={2} bgcolor="grey.50" borderRadius={1}>
                        <Typography variant="h4" color="success.main" fontWeight="bold">
                          {stats.totalCompletedRegistrations}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {translations.userStatistics.completedRegistrations}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center" p={2} bgcolor="grey.50" borderRadius={1}>
                        <Typography variant="h4" color="warning.main" fontWeight="bold">
                          {stats.total2FAEnabled}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {translations.userStatistics.twoFactorEnabled}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {translations.userList.title}
              </Typography>
              <TableContainer>
                <Table>
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
                            color={user.role === 'ADMIN' ? 'error' : 'primary'}
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
        </Box>
      )}
    </Box>
  );
};

export { SystemPage }; 