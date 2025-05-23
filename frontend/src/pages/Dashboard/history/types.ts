export interface LogStats {
  totalLogs: number;
  errorCount: number;
  warnCount: number;
  eventCounts: Record<string, number>;
  participantActivity: Record<string, number>;
  barrelActivity: Record<string, number>;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  service: string;
  event?: string;
  [key: string]: unknown;
}

export interface LogsResponse {
  logs: LogEntry[];
  total: number;
} 