import type { Request, Response, NextFunction } from 'express';
import type { LoggingService } from './logging.service';

export interface HttpLoggingOptions {
  /**
   * Exact path prefixes to skip (without querystring).
   * Example: `/api/system/health`
   */
  skipPathPrefixes?: string[];
}

export function httpLoggingMiddleware(
  logging: LoggingService,
  options: HttpLoggingOptions = {},
) {
  const skipPrefixes = options.skipPathPrefixes ?? [
    '/api/system/health',
    '/api/uploads/',
  ];

  return (req: Request, res: Response, next: NextFunction) => {
    const start = process.hrtime.bigint();

    const path = String(req.originalUrl || req.url || '').split('?')[0];
    
    // Log incoming requests for backup endpoint to debug hanging issues
    if (path.includes('/backup')) {
      console.log(`[HTTP MIDDLEWARE] Incoming ${req.method} request to ${path}`);
      console.log(`[HTTP MIDDLEWARE] Origin: ${req.headers.origin}`);
      console.log(`[HTTP MIDDLEWARE] Auth: ${req.headers.authorization ? 'present' : 'missing'}`);
      logging.info(`[HTTP] Incoming ${req.method} request to ${path}`, {
        event: 'HTTP_REQUEST_INCOMING',
        method: req.method,
        path,
        headers: {
          origin: req.headers.origin,
          authorization: req.headers.authorization ? 'present' : 'missing',
        },
      });
    }
    
    if (skipPrefixes.some((p) => path.startsWith(p))) {
      next();
      return;
    }

    res.on('finish', () => {
      const end = process.hrtime.bigint();
      const durationMs = Number(end - start) / 1_000_000;

      const statusCode = res.statusCode;
      const method = req.method;
      const ip =
        (req.headers['x-forwarded-for'] as string | undefined)
          ?.split(',')[0]
          ?.trim() || req.ip;

      const user = (req as any).user;
      const userId = user?.id as string | undefined;

      const meta: Record<string, unknown> = {
        event: 'HTTP_ACCESS',
        method,
        path,
        statusCode,
        durationMs: Math.round(durationMs),
        ip,
        userId,
        requestId: req['requestId'],
        userAgent: req.headers['user-agent'],
      };

      const message = `${method} ${path} ${statusCode} ${meta.durationMs}ms`;

      if (statusCode >= 500) {
        logging.error(message, meta);
      } else if (statusCode >= 400) {
        logging.warn(message, meta);
      } else {
        logging.info(message, meta);
      }
    });

    next();
  };
}
