import type { Request, Response, NextFunction } from 'express';
import { runWithRequestLogContext, type AppSource } from './request-context';

const X_APP = 'x-app';

export function requestAppContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const raw = (req.headers[X_APP] as string)?.toLowerCase()?.trim();
  const app: AppSource | undefined =
    raw === 'web' || raw === 'mobile' ? raw : undefined;

  runWithRequestLogContext({ app }, () => next());
}
