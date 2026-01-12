import { Module } from '@nestjs/common';
import { BarrelsService } from './barrels.service';
import { BarrelsController } from './barrels.controller';
import { LoggingModule } from '../logging/logging.module';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';

@Module({
  imports: [LoggingModule, LeaderboardModule],
  controllers: [BarrelsController],
  providers: [BarrelsService],
  exports: [BarrelsService],
})
export class BarrelsModule {}
