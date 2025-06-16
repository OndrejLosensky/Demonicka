import { Injectable } from '@nestjs/common';
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { ConfigService } from '../../config/config.service';
import { RateLimitExceededError } from '../errors/rate-limit.error';
import { RateLimitOptions } from '../decorators/rate-limit.decorator';

@Injectable()
export class RateLimiterService {
  private readonly defaultLimiter: RateLimiterMemory;
  private readonly customLimiters: Map<string, RateLimiterMemory> = new Map();

  constructor(private configService: ConfigService) {
    this.defaultLimiter = new RateLimiterMemory({
      points: configService.rateLimitPoints,
      duration: configService.rateLimitDuration,
    });
  }

  async checkRateLimit(key: string, options?: RateLimitOptions): Promise<void> {
    const limiter = this.getLimiter(key, options);

    try {
      const result = await limiter.consume(key);
      if (!(result instanceof RateLimiterRes)) {
        throw new RateLimitExceededError();
      }
    } catch {
      throw new RateLimitExceededError();
    }
  }

  private getLimiter(key: string, options?: RateLimitOptions): RateLimiterMemory {
    if (!options) {
      return this.defaultLimiter;
    }

    const limiterKey = this.getLimiterKey(key, options);
    let limiter = this.customLimiters.get(limiterKey);

    if (!limiter) {
      limiter = new RateLimiterMemory({
        points: options.points,
        duration: options.duration,
      });
      this.customLimiters.set(limiterKey, limiter);
    }

    return limiter;
  }

  private getLimiterKey(key: string, options: RateLimitOptions): string {
    return `${key}:${options.points}:${options.duration}`;
  }
} 