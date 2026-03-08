import type { Request, Response, NextFunction } from 'express';
import type { MetricsService } from './metrics.service';

export function createMetricsMiddleware(metricsService: MetricsService) {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = process.hrtime.bigint();
    metricsService.incrementActive();

    res.on('finish', () => {
      metricsService.decrementActive();
      const end = process.hrtime.bigint();
      const durationMs = Number(end - start) / 1_000_000;
      const path = String(req.originalUrl || req.url || '').split('?')[0];
      metricsService.recordRequest(path, durationMs, res.statusCode);
    });

    next();
  };
}
