import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MetricsService } from '../metrics/metrics.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { JobsGateway } from '../job-queue/jobs.gateway';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

@Injectable()
export class SystemService {
  private readonly logger = new Logger(SystemService.name);
  private startTime = Date.now();

  constructor(
    private prisma: PrismaService,
    private metrics: MetricsService,
    private notificationsGateway: NotificationsGateway,
    private jobsGateway: JobsGateway,
  ) {}

  async getSystemHealth() {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    // Get database stats (size, status) and real connection count + response time
    const dbStats = await this.getDatabaseStats();
    const dbConnections = await this.getDatabaseConnectionCount();
    const dbResponseTimeMs = await this.measureDatabaseResponseTime();

    // Get storage stats (logs + backups)
    const storageStats = await this.getStorageStats();

    // Real API metrics from request tracking
    const requestsPerMinute = this.metrics.getRequestsPerMinute();
    const errorRate = this.metrics.getErrorRate();
    const apiResponseTimeMs = this.metrics.getAverageResponseTimeMs();
    const apiStatus = this.deriveApiStatus(apiResponseTimeMs, errorRate);

    // Determine overall status
    const status = this.calculateOverallStatus({
      memory: usedMemory / totalMemory,
      database: dbStats.status,
      api: apiStatus,
      storage: storageStats.status,
    });

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime,
      memory: {
        used: usedMemory,
        total: totalMemory,
        percentage: (usedMemory / totalMemory) * 100,
      },
      database: {
        size: dbStats.size,
        connections: dbConnections,
        responseTime: Math.max(0, dbResponseTimeMs),
        status: dbStats.status,
      },
      api: {
        responseTime: apiResponseTimeMs,
        requestsPerMinute,
        errorRate,
        status: apiStatus,
      },
      storage: storageStats,
      services: {
        database: true,
        logging: true,
        websocket: true,
        fileSystem: true,
      },
    };
  }

  async getPerformanceMetrics() {
    const notificationsCount = this.notificationsGateway.getConnectionCount();
    const jobsCount = this.jobsGateway.getConnectionCount();
    const dbConnections = await this.getDatabaseConnectionCount();
    const apiActive = this.metrics.getActiveRequestCount();

    const slowest = this.metrics.getSlowestEndpoints(10);
    const errorRates = this.metrics.getErrorRatesByEndpoint();

    return {
      apiResponseTimes: slowest,
      errorRates,
      activeConnections: {
        websocket: notificationsCount + jobsCount,
        database: dbConnections,
        api: apiActive,
      },
    };
  }

  async getSystemAlerts() {
    // Mock alerts - in a real app, you'd generate these based on actual system conditions
    const alerts: Array<{
      id: string;
      type: 'warning' | 'error' | 'info';
      message: string;
      timestamp: string;
      resolved: boolean;
    }> = [];

    // Check memory usage
    const memoryUsage = process.memoryUsage();
    if (memoryUsage.heapUsed / memoryUsage.heapTotal > 0.8) {
      alerts.push({
        id: 'memory-warning',
        type: 'warning' as const,
        message: 'Vysoké využití paměti - 80%',
        timestamp: new Date().toISOString(),
        resolved: false,
      });
    }

    // Check database size
    const dbStats = await this.getDatabaseStats();
    if (dbStats.size > 100 * 1024 * 1024) {
      // 100MB
      alerts.push({
        id: 'database-size-warning',
        type: 'warning' as const,
        message: 'Velikost databáze přesahuje 100MB',
        timestamp: new Date().toISOString(),
        resolved: false,
      });
    }

    return alerts;
  }

  async resolveAlert(alertId: string) {
    this.logger.log(`Alert ${alertId} resolved`);
    return { success: true };
  }

  async getDatabaseStats() {
    try {
      // Get database size using PostgreSQL query
      const sizeResult = await this.prisma.$queryRaw<Array<{ size: bigint }>>`
        SELECT pg_database_size(current_database()) as size
      `;
      const size = Number(sizeResult[0]?.size || 0);

      // Get table information
      const tables = await this.prisma.$queryRaw<Array<{ tablename: string }>>`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
      `;

      const tableStats: Array<{
        name: string;
        rowCount: number;
        size: number;
      }> = [];

      for (const table of tables) {
        const countResult = await this.prisma.$queryRaw<
          Array<{ count: bigint }>
        >`
          SELECT COUNT(*) as count FROM ${this.prisma.$queryRawUnsafe(`"${table.tablename}"`)}
        `;
        const rowCount = Number(countResult[0]?.count || 0);

        tableStats.push({
          name: table.tablename,
          rowCount,
          size: 0, // Could calculate with pg_total_relation_size if needed
        });
      }

      // Determine database status
      let status: 'healthy' | 'warning' | 'error' = 'healthy';
      if (size > 100 * 1024 * 1024) {
        // 100MB
        status = 'warning';
      }
      if (size > 500 * 1024 * 1024) {
        // 500MB
        status = 'error';
      }

      return {
        size,
        tables: tableStats,
        indexes: 0, // Could query pg_indexes if needed
        lastBackup: null, // Would need to implement backup tracking
        status,
      };
    } catch (error) {
      this.logger.error('Failed to get database stats:', error);
      return {
        size: 0,
        tables: [],
        indexes: 0,
        lastBackup: null,
        status: 'error' as const,
      };
    }
  }

  async getLogStats() {
    try {
      const logDir = 'logs';
      const appDirs = ['backend', 'web', 'mobile'];

      let totalLogs = 0;
      let logsToday = 0;
      let errorCount = 0;
      let warningCount = 0;
      let totalSize = 0;
      let oldestLog = new Date().toISOString();
      let newestLog = new Date(0).toISOString();

      const today = new Date().toDateString();

      for (const appName of appDirs) {
        const dir = path.join(logDir, appName);
        let files: string[] = [];
        try {
          files = await fs.readdir(dir);
        } catch {
          continue;
        }
        for (const file of files) {
          if (!file.endsWith('.log')) continue;
          const filePath = path.join(dir, file);
          const stats = await fs.stat(filePath);
          totalSize += stats.size;

          const content = await fs.readFile(filePath, 'utf-8');
          const lines = content.split('\n').filter((line) => line.trim());
          totalLogs += lines.length;

          const todayLines = lines.filter((line) => {
            try {
              const logData = JSON.parse(line);
              return new Date(logData.timestamp).toDateString() === today;
            } catch {
              return false;
            }
          });
          logsToday += todayLines.length;

          lines.forEach((line) => {
            try {
              const logData = JSON.parse(line);
              const level = String(logData.level ?? '').toLowerCase();
              if (level === 'error') errorCount++;
              if (level === 'warn') warningCount++;
            } catch {
              // Skip invalid JSON lines
            }
          });

          lines.forEach((line) => {
            try {
              const logData = JSON.parse(line);
              const timestamp = new Date(logData.timestamp);
              if (timestamp < new Date(oldestLog)) {
                oldestLog = logData.timestamp;
              }
              if (timestamp > new Date(newestLog)) {
                newestLog = logData.timestamp;
              }
            } catch {
              // Skip invalid JSON lines
            }
          });
        }
      }

      return {
        totalLogs,
        logsToday,
        errorCount,
        warningCount,
        logFileSize: totalSize,
        oldestLog,
        newestLog,
      };
    } catch (error) {
      this.logger.error('Failed to get log stats:', error);
      return {
        totalLogs: 0,
        logsToday: 0,
        errorCount: 0,
        warningCount: 0,
        logFileSize: 0,
        oldestLog: new Date().toISOString(),
        newestLog: new Date().toISOString(),
      };
    }
  }

  private async getStorageStats() {
    try {
      const logDir = 'logs';
      const backupDir = 'data/backups';

      let logsSize = 0;
      let backupsSize = 0;

      // Calculate logs size (logs/backend, logs/web, logs/mobile)
      const appDirs = ['backend', 'web', 'mobile'];
      for (const appName of appDirs) {
        try {
          const dir = path.join(logDir, appName);
          const logFiles = await fs.readdir(dir);
          for (const file of logFiles) {
            if (file.endsWith('.log')) {
              logsSize += (await fs.stat(path.join(dir, file))).size;
            }
          }
        } catch {
          // Subdir may not exist
        }
      }

      // Calculate backups size
      try {
        const backupFiles = await fs.readdir(backupDir);
        for (const file of backupFiles) {
          const stats = await fs.stat(path.join(backupDir, file));
          backupsSize += stats.size;
        }
      } catch {
        // Backups directory might not exist
      }

      const totalSize = logsSize + backupsSize;

      let status: 'healthy' | 'warning' | 'error' = 'healthy';
      if (totalSize > 500 * 1024 * 1024) {
        // 500MB
        status = 'warning';
      }
      if (totalSize > 1 * 1024 * 1024 * 1024) {
        // 1GB
        status = 'error';
      }

      return {
        logsSize,
        backupsSize,
        totalSize,
        status,
      };
    } catch (error) {
      this.logger.error('Failed to get storage stats:', error);
      return {
        logsSize: 0,
        backupsSize: 0,
        totalSize: 0,
        status: 'error' as const,
      };
    }
  }

  private async getDatabaseConnectionCount(): Promise<number> {
    try {
      const result = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT count(*) as count FROM pg_stat_activity WHERE datname = current_database()
      `;
      return Number(result[0]?.count ?? 0);
    } catch {
      return 0;
    }
  }

  private async measureDatabaseResponseTime(): Promise<number> {
    const start = process.hrtime.bigint();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const end = process.hrtime.bigint();
      return Math.round(Number(end - start) / 1_000_000);
    } catch {
      return -1;
    }
  }

  private deriveApiStatus(
    responseTimeMs: number,
    errorRate: number,
  ): 'healthy' | 'warning' | 'error' {
    if (errorRate >= 0.05) return 'error';
    if (errorRate >= 0.02 || responseTimeMs >= 1000) return 'warning';
    return 'healthy';
  }

  private calculateOverallStatus(componentStatuses: {
    memory: number;
    database: 'healthy' | 'warning' | 'error';
    api: 'healthy' | 'warning' | 'error';
    storage: 'healthy' | 'warning' | 'error';
  }): 'healthy' | 'warning' | 'error' {
    const { memory, database, api, storage } = componentStatuses;

    if (database === 'error' || api === 'error' || storage === 'error') {
      return 'error';
    }

    if (
      database === 'warning' ||
      api === 'warning' ||
      storage === 'warning' ||
      memory > 0.8
    ) {
      return 'warning';
    }

    return 'healthy';
  }
}
