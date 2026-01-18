import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserStatsService } from './user-stats.service';
import { ProfilePictureService } from './profile-picture.service';
import { LoggingModule } from '../logging/logging.module';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';

@Module({
  imports: [LoggingModule, LeaderboardModule],
  providers: [UsersService, UserStatsService, ProfilePictureService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
