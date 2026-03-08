import { Module } from '@nestjs/common';
import { AchievementsController } from './achievements.controller';
import { AchievementsService } from './achievements.service';
import { AchievementsCronService } from './achievements-cron.service';
import { JobQueueModule } from '../job-queue/job-queue.module';

@Module({
  imports: [JobQueueModule],
  controllers: [AchievementsController],
  providers: [AchievementsService, AchievementsCronService],
  exports: [AchievementsService],
})
export class AchievementsModule {}
