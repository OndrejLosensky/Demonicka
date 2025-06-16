import { HttpException, HttpStatus } from '@nestjs/common';

export class RateLimitExceededError extends HttpException {
  constructor() {
    super(
      {
        message: 'Too Many Requests',
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
} 