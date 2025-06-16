import { Module } from '@nestjs/common';
import { RateLimiterService } from './services/rate-limiter.service';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [ConfigModule],
  providers: [RateLimiterService],
  exports: [RateLimiterService],
})
export class CommonModule {} 