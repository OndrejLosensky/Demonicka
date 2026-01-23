import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoggingService } from '../logging/logging.service';
import { UpdateLeaderboardViewSettingsDto } from './dto/update-leaderboard-view-settings.dto';
import type { LeaderboardViewSettings } from '@prisma/client';
import { LeaderboardGateway } from '../leaderboard/leaderboard.gateway';

@Injectable()
export class LeaderboardViewSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logging: LoggingService,
    @Inject(forwardRef(() => LeaderboardGateway))
    private readonly leaderboardGateway: LeaderboardGateway,
  ) {}

  async getOrCreate(): Promise<LeaderboardViewSettings> {
    const existing = await this.prisma.leaderboardViewSettings.findFirst();
    if (existing) return existing;

    return this.prisma.leaderboardViewSettings.create({
      data: {},
    });
  }

  async get(): Promise<LeaderboardViewSettings> {
    return this.getOrCreate();
  }

  async update(
    dto: UpdateLeaderboardViewSettingsDto,
    actorUserId: string,
  ): Promise<LeaderboardViewSettings> {
    const current = await this.getOrCreate();

    const updated = await this.prisma.leaderboardViewSettings.update({
      where: { id: current.id },
      data: {
        ...dto,
        updatedBy: actorUserId,
      },
    });

    this.logging.info('Settings changed', {
      event: 'SETTINGS_CHANGED',
      setting: 'LEADERBOARD_VIEW_SETTINGS',
      actorUserId,
      old: {
        autoSwitchEnabled: current.autoSwitchEnabled,
        currentView: current.currentView,
        switchIntervalSeconds: current.switchIntervalSeconds,
        selectedBeerPongEventId: current.selectedBeerPongEventId,
      },
      new: {
        autoSwitchEnabled: updated.autoSwitchEnabled,
        currentView: updated.currentView,
        switchIntervalSeconds: updated.switchIntervalSeconds,
        selectedBeerPongEventId: updated.selectedBeerPongEventId,
      },
    });

    // Emit WebSocket update
    this.leaderboardGateway.emitLeaderboardViewSettingsUpdate(updated);

    return updated;
  }
}
