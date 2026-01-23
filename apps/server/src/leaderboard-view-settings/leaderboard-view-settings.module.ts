import { Module, forwardRef } from '@nestjs/common';
import { LeaderboardViewSettingsController } from './leaderboard-view-settings.controller';
import { LeaderboardViewSettingsService } from './leaderboard-view-settings.service';
import { LoggingModule } from '../logging/logging.module';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';

@Module({
  imports: [LoggingModule, forwardRef(() => LeaderboardModule)],
  controllers: [LeaderboardViewSettingsController],
  providers: [LeaderboardViewSettingsService],
  exports: [LeaderboardViewSettingsService],
})
export class LeaderboardViewSettingsModule {}
