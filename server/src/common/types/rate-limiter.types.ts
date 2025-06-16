import { RateLimiterMemory } from 'rate-limiter-flexible';

export type SafeRateLimiter = RateLimiterMemory & {
  consume(key: string): Promise<unknown>;
}; 