import { apiClient as api } from '../utils/apiClient';

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'error';
  timestamp: string;
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  database: {
    size: number;
    connections: number;
    responseTime: number;
    status: 'healthy' | 'warning' | 'error';
  };
  api: {
    responseTime: number;
    requestsPerMinute: number;
    errorRate: number;
    status: 'healthy' | 'warning' | 'error';
  };
  storage: {
    logsSize: number;
    backupsSize: number;
    totalSize: number;
    status: 'healthy' | 'warning' | 'error';
  };
  services: {
    database: boolean;
    logging: boolean;
    websocket: boolean;
    fileSystem: boolean;
  };
}

export interface PerformanceMetrics {
  apiResponseTimes: Array<{
    endpoint: string;
    averageTime: number;
    maxTime: number;
    minTime: number;
    requestCount: number;
  }>;
  errorRates: Array<{
    endpoint: string;
    errorCount: number;
    totalRequests: number;
    errorRate: number;
  }>;
  activeConnections: {
    websocket: number;
    database: number;
    api: number;
  };
}

export interface SystemAlerts {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: string;
  resolved: boolean;
}

class SystemHealthService {
  async getSystemHealth(): Promise<SystemHealth> {
    const response = await api.get('/system/health');
    return response.data;
  }

  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const response = await api.get('/system/performance');
    return response.data;
  }

  async getSystemAlerts(): Promise<SystemAlerts[]> {
    const response = await api.get('/system/alerts');
    return response.data;
  }

  async resolveAlert(alertId: string): Promise<void> {
    await api.post(`/system/alerts/${alertId}/resolve`);
  }

  async getDatabaseStats(): Promise<{
    size: number;
    tables: Array<{
      name: string;
      rowCount: number;
      size: number;
    }>;
    indexes: number;
    lastBackup: string | null;
  }> {
    const response = await api.get('/system/database/stats');
    return response.data;
  }

  async getLogStats(): Promise<{
    totalLogs: number;
    logsToday: number;
    errorCount: number;
    warningCount: number;
    logFileSize: number;
    oldestLog: string;
    newestLog: string;
  }> {
    const response = await api.get('/system/logs/stats');
    return response.data;
  }
}

export const systemHealthService = new SystemHealthService(); 