import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const existing =
    (req.headers['x-request-id'] as string | undefined) ||
    (req.headers['x-requestid'] as string | undefined);

  const requestId = existing || randomUUID();
  req['requestId'] = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
}

