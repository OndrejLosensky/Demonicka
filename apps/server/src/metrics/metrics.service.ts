import { Injectable } from '@nestjs/common';

const WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const SLOW_ENDPOINTS_WINDOW_MS = 2 * 60 * 1000; // 2 minutes for rolling slow-endpoints list
const MAX_ENTRIES = 15_000;

/** Normalize path for display (e.g. /api/v1/events -> /api/events). */
function normalizePathForDisplay(path: string): string {
  return path.replace(/^\/api\/v1\//, '/api/');
}

interface RequestEntry {
  path: string;
  durationMs: number;
  statusCode: number;
  timestamp: number;
}

/** Path prefixes to skip for metrics (e.g. health checks to avoid feedback). */
const SKIP_PATHS = [
  '/api/system/health',
  '/api/v1/system/health',
  '/api/system/performance',
  '/api/v1/system/performance',
];

@Injectable()
export class MetricsService {
  private readonly entries: RequestEntry[] = [];
  private activeRequestCount = 0;

  /** Call when a request starts. */
  incrementActive(): void {
    this.activeRequestCount++;
  }

  /** Call when a request finishes. */
  decrementActive(): void {
    if (this.activeRequestCount > 0) {
      this.activeRequestCount--;
    }
  }

  /** Record a completed request. */
  recordRequest(path: string, durationMs: number, statusCode: number): void {
    if (SKIP_PATHS.some((p) => path.startsWith(p))) {
      return;
    }
    const now = Date.now();
    this.entries.push({ path, durationMs, statusCode, timestamp: now });
    this.prune(now);
  }

  private prune(now: number): void {
    const cutoff = now - WINDOW_MS;
    while (this.entries.length > 0 && this.entries[0].timestamp < cutoff) {
      this.entries.shift();
    }
    while (this.entries.length > MAX_ENTRIES) {
      this.entries.shift();
    }
  }

  getActiveRequestCount(): number {
    return this.activeRequestCount;
  }

  /** Requests in the last 60 seconds. */
  getRequestsPerMinute(): number {
    const now = Date.now();
    const cutoff = now - 60_000;
    return this.entries.filter((e) => e.timestamp >= cutoff).length;
  }

  /** Error rate (status >= 400) in the last 5 minutes. */
  getErrorRate(): number {
    this.prune(Date.now());
    if (this.entries.length === 0) return 0;
    const errors = this.entries.filter((e) => e.statusCode >= 400).length;
    return errors / this.entries.length;
  }

  /** Average response time in ms over the last 5 minutes. */
  getAverageResponseTimeMs(): number {
    this.prune(Date.now());
    if (this.entries.length === 0) return 0;
    const sum = this.entries.reduce((a, e) => a + e.durationMs, 0);
    return Math.round(sum / this.entries.length);
  }

  /** Slowest endpoints by average response time (last 5 min). */
  getSlowestEndpoints(limit: number): Array<{ endpoint: string; averageTime: number; maxTime: number; minTime: number; requestCount: number }> {
    this.prune(Date.now());
    return this.getSlowestEndpointsInWindow(limit, WINDOW_MS, false);
  }

  /** Slowest endpoints in the last 2 minutes (rolling, so the list changes more). Normalized paths for display. */
  getSlowestEndpointsRecent(limit: number): Array<{ endpoint: string; averageTime: number; maxTime: number; minTime: number; requestCount: number }> {
    this.prune(Date.now());
    return this.getSlowestEndpointsInWindow(limit, SLOW_ENDPOINTS_WINDOW_MS, true);
  }

  private getSlowestEndpointsInWindow(
    limit: number,
    windowMs: number,
    normalizePath: boolean,
  ): Array<{ endpoint: string; averageTime: number; maxTime: number; minTime: number; requestCount: number }> {
    const now = Date.now();
    const cutoff = now - windowMs;
    const inWindow = this.entries.filter((e) => e.timestamp >= cutoff);
    const byPath = new Map<
      string,
      { total: number; count: number; max: number; min: number }
    >();
    for (const e of inWindow) {
      const key = normalizePath ? normalizePathForDisplay(e.path) : e.path;
      const cur = byPath.get(key);
      if (!cur) {
        byPath.set(key, { total: e.durationMs, count: 1, max: e.durationMs, min: e.durationMs });
      } else {
        cur.total += e.durationMs;
        cur.count += 1;
        cur.max = Math.max(cur.max, e.durationMs);
        cur.min = Math.min(cur.min, e.durationMs);
      }
    }
    return Array.from(byPath.entries())
      .map(([endpoint, data]) => ({
        endpoint,
        averageTime: data.total / data.count,
        maxTime: data.max,
        minTime: data.min,
        requestCount: data.count,
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, limit);
  }

  /** Error rates per endpoint (last 5 min). */
  getErrorRatesByEndpoint(): Array<{ endpoint: string; errorCount: number; totalRequests: number; errorRate: number }> {
    this.prune(Date.now());
    const byPath = new Map<string, { errors: number; total: number }>();
    for (const e of this.entries) {
      const cur = byPath.get(e.path);
      if (!cur) {
        byPath.set(e.path, { errors: e.statusCode >= 400 ? 1 : 0, total: 1 });
      } else {
        cur.total += 1;
        if (e.statusCode >= 400) cur.errors += 1;
      }
    }
    return Array.from(byPath.entries())
      .filter(([, data]) => data.total > 0)
      .map(([endpoint, data]) => ({
        endpoint,
        errorCount: data.errors,
        totalRequests: data.total,
        errorRate: data.errors / data.total,
      }))
      .sort((a, b) => b.errorRate - a.errorRate);
  }
}
