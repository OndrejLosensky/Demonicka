import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Storage as StorageIcon,
  Memory as MemoryIcon,
  Speed as SpeedIcon,
  Storage as DatabaseIcon,
  Wifi as WifiIcon,

} from '@mui/icons-material';
import { systemHealthService, type SystemHealth, type PerformanceMetrics, type SystemAlerts } from '../../../../services/systemHealthService';
import { toast } from 'react-hot-toast';

interface SystemHealthDashboardProps {
  onRefresh?: () => void;
}

export const SystemHealthDashboard: React.FC<SystemHealthDashboardProps> = ({ onRefresh }) => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [alerts, setAlerts] = useState<SystemAlerts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadHealthData = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const [healthData, performanceData, alertsData] = await Promise.all([
        systemHealthService.getSystemHealth(),
        systemHealthService.getPerformanceMetrics(),
        systemHealthService.getSystemAlerts(),
      ]);

      setHealth(healthData);
      setPerformance(performanceData);
      setAlerts(alertsData);
    } catch (error) {
      console.error('Failed to load system health data:', error);
      toast.error('Nepodařilo se načíst data o zdraví systému');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadHealthData();
    
    const interval = setInterval(() => {
      loadHealthData(true);
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    loadHealthData(true);
    onRefresh?.();
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await systemHealthService.resolveAlert(alertId);
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      toast.success('Upozornění bylo vyřešeno');
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      toast.error('Nepodařilo se vyřešit upozornění');
    }
  };

  const getStatusColor = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'primary';
    }
  };

  const getStatusIcon = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy': return <CheckCircleIcon />;
      case 'warning': return <WarningIcon />;
      case 'error': return <ErrorIcon />;
      default: return <InfoIcon />;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!health) {
    return (
      <Alert severity="error">
        <AlertTitle>Chyba</AlertTitle>
        Nepodařilo se načíst data o zdraví systému
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleIcon color={getStatusColor(health.status)} />
          Stav systému
        </Typography>
        <Tooltip title="Obnovit">
          <IconButton onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* System Status Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color={getStatusColor(health.status)} gutterBottom>
                  {getStatusIcon(health.status)}
                </Typography>
                <Typography variant="h6" gutterBottom>
                  Celkový stav
                </Typography>
                <Chip 
                  label={health.status === 'healthy' ? 'V pořádku' : health.status === 'warning' ? 'Varování' : 'Chyba'}
                  color={getStatusColor(health.status)}
                  variant="outlined"
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary" gutterBottom>
                  <SpeedIcon />
                </Typography>
                <Typography variant="h6" gutterBottom>
                  Doba běhu
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatUptime(health.uptime)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary" gutterBottom>
                  <MemoryIcon />
                </Typography>
                <Typography variant="h6" gutterBottom>
                  Paměť
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatBytes(health.memory.used)} / {formatBytes(health.memory.total)}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={health.memory.percentage} 
                  sx={{ mt: 1 }}
                  color={health.memory.percentage > 80 ? 'error' : health.memory.percentage > 60 ? 'warning' : 'primary'}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary" gutterBottom>
                  <StorageIcon />
                </Typography>
                <Typography variant="h6" gutterBottom>
                  Úložiště
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatBytes(health.storage.totalSize)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Service Status */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DatabaseIcon />
                Databáze
              </Typography>
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Velikost: {formatBytes(health.database.size)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Připojení: {health.database.connections}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Odezva: {health.database.responseTime}ms
                </Typography>
              </Box>
              <Chip 
                label={health.database.status === 'healthy' ? 'V pořádku' : health.database.status === 'warning' ? 'Varování' : 'Chyba'}
                color={getStatusColor(health.database.status)}
                size="small"
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WifiIcon />
                API
              </Typography>
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Odezva: {health.api.responseTime}ms
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Požadavky/min: {health.api.requestsPerMinute}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Chyby: {(health.api.errorRate * 100).toFixed(2)}%
                </Typography>
              </Box>
              <Chip 
                label={health.api.status === 'healthy' ? 'V pořádku' : health.api.status === 'warning' ? 'Varování' : 'Chyba'}
                color={getStatusColor(health.api.status)}
                size="small"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Services Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Stav služeb
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(health.services).map(([service, isRunning]) => (
              <Grid item xs={6} sm={3} key={service}>
                <Box display="flex" alignItems="center" gap={1}>
                  {isRunning ? <CheckCircleIcon color="success" /> : <ErrorIcon color="error" />}
                  <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                    {service === 'database' ? 'Databáze' : 
                     service === 'logging' ? 'Logování' : 
                     service === 'websocket' ? 'WebSocket' : 
                     service === 'fileSystem' ? 'Soubory' : service}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Upozornění ({alerts.filter(a => !a.resolved).length})
            </Typography>
            <List>
              {alerts.filter(alert => !alert.resolved).map((alert) => (
                <React.Fragment key={alert.id}>
                  <ListItem
                    secondaryAction={
                      <IconButton 
                        edge="end" 
                        onClick={() => handleResolveAlert(alert.id)}
                        size="small"
                      >
                        <CloseIcon />
                      </IconButton>
                    }
                  >
                    <ListItemIcon>
                      {alert.type === 'error' ? <ErrorIcon color="error" /> :
                       alert.type === 'warning' ? <WarningIcon color="warning" /> :
                       <InfoIcon color="info" />}
                    </ListItemIcon>
                    <ListItemText
                      primary={alert.message}
                      secondary={new Date(alert.timestamp).toLocaleString('cs-CZ')}
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics */}
      {performance && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Výkonnostní metriky
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" gutterBottom>
                  Aktivní připojení
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  WebSocket: {performance.activeConnections.websocket}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Databáze: {performance.activeConnections.database}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  API: {performance.activeConnections.api}
                </Typography>
              </Grid>
              <Grid item xs={12} md={8}>
                <Typography variant="subtitle2" gutterBottom>
                  Nejpomalejší endpointy
                </Typography>
                {performance.apiResponseTimes
                  .sort((a, b) => b.averageTime - a.averageTime)
                  .slice(0, 3)
                  .map((endpoint) => (
                    <Box key={endpoint.endpoint} mb={1}>
                      <Typography variant="body2">
                        {endpoint.endpoint}: {endpoint.averageTime.toFixed(2)}ms
                      </Typography>
                    </Box>
                  ))}
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}; 