import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardController } from './leaderboard.controller';
import { User } from '../users/entities/user.entity';
import { EventBeer } from '../events/entities/event-beer.entity';
import { LeaderboardGateway } from './leaderboard.gateway';
import { DashboardModule } from '../dashboard/dashboard.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, EventBeer]),
    DashboardModule,
  ],
  controllers: [LeaderboardController],
  providers: [LeaderboardService, LeaderboardGateway],
  exports: [LeaderboardService, LeaderboardGateway],
})
export class LeaderboardModule {} 