import type { JobHandlerRegistry } from '../../job-queue/job-handler.registry';
import type { AchievementsService } from '../../achievements/achievements.service';
import { JOB_TYPES } from '../../job-queue/job-handler.registry';

interface AchievementsCheckPayload {
  userId?: string;
  fullScan?: boolean;
}

export function registerAchievementsCheckHandler(
  registry: JobHandlerRegistry,
  achievementsService: AchievementsService,
): void {
  registry.register(
    JOB_TYPES.ACHIEVEMENTS_CHECK,
    async (payload, _jobId, context) => {
      const { userId, fullScan } = payload as AchievementsCheckPayload;
      if (fullScan) {
        context.appendLog('info', 'Kontrola achievementů: start');
        const result = await achievementsService.checkAndUpdateAchievementsForAllUsers(
          (msg) => context.appendLog('info', msg),
        );
        context.appendLog('info', `Hotovo: zkontrolováno ${result.usersChecked} uživatelů`);
        return result;
      }
      if (userId) {
        await achievementsService.checkAndUpdateAchievements(userId);
        return { userId };
      }
      throw new Error('Payload must contain userId or fullScan: true');
    },
  );
}
