import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { SKIP_RATE_LIMIT_KEY } from '../decorators/skip-rate-limit.decorator';
import { RATE_LIMIT_KEY, RateLimitOptions } from '../decorators/rate-limit.decorator';
import { RateLimiterService } from '../services/rate-limiter.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private rateLimiterService: RateLimiterService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skipRateLimit = this.reflector.getAllAndOverride<boolean>(
      SKIP_RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipRateLimit) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const key = this.getClientKey(request);

    const options = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    await this.rateLimiterService.checkRateLimit(key, options);
    return true;
  }

  private getClientKey(request: Request): string {
    // Use X-Forwarded-For header if behind a proxy, otherwise use the remote address
    const clientIp =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      request.ip ||
      request.socket.remoteAddress ||
      'unknown';

    // Include the path in the rate limit key to have per-endpoint limits
    return `${clientIp}:${request.method}:${request.path}`;
  }
} 