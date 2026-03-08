import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JobQueueService } from '../job-queue/job-queue.service';
import { JOB_TYPES } from '../job-queue/job-handler.registry';

/**
 * Enqueues the achievements.check job once per hour so it appears in "Úlohy"
 * and runs in the background. No per-beer enqueue; add-beer stays fast.
 */
@Injectable()
export class AchievementsCronService {
  private readonly logger = new Logger(AchievementsCronService.name);

  constructor(private readonly jobQueueService: JobQueueService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async enqueueAchievementsCheck(): Promise<void> {
    try {
      const jobId = await this.jobQueueService.enqueue({
        type: JOB_TYPES.ACHIEVEMENTS_CHECK,
        payload: { fullScan: true },
        createdByUserId: null,
      });
      this.logger.log(`Enqueued achievements check job ${jobId}`);
    } catch (error) {
      this.logger.error('Failed to enqueue achievements check job', error);
    }
  }
}
