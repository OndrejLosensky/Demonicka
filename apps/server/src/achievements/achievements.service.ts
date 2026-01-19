import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  Achievement,
  AchievementType,
  BeerPongGameStatus,
  BeerPongRound,
  UserAchievement,
} from '@prisma/client';
import {
  AchievementDto,
  UserAchievementDto,
  UserAchievementsResponseDto,
  GlobalAchievementsResponseDto,
  CreateAchievementDto,
  UpdateAchievementDto,
} from './dto/achievement.dto';
import { subHours } from 'date-fns';

@Injectable()
export class AchievementsService {
  private readonly logger = new Logger(AchievementsService.name);

  constructor(private prisma: PrismaService) {}

  private toSlug(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  async getUserAchievements(
    userId: string,
  ): Promise<UserAchievementsResponseDto> {
    // Ensure user achievements are initialized and up-to-date on first load
    await this.checkAndUpdateAchievements(userId);

    const userAchievements = await this.prisma.userAchievement.findMany({
      where: { userId, deletedAt: null },
      include: { achievement: true },
      orderBy: { createdAt: 'asc' },
    });

    const totalPoints = userAchievements
      .filter((ua) => ua.isCompleted)
      .reduce((sum, ua) => sum + ua.achievement.points * ua.completionCount, 0);

    const completedCount = userAchievements.filter(
      (ua) => ua.isCompleted,
    ).length;
    const totalCount = userAchievements.length;

    return {
      achievements: userAchievements.map((ua) =>
        this.mapToUserAchievementDto(ua),
      ),
      totalPoints,
      completedCount,
      totalCount,
    };
  }

  async getGlobalAchievements(
    userId: string,
  ): Promise<GlobalAchievementsResponseDto> {
    // Ensure the requesting user's progress is initialized/up-to-date.
    await this.checkAndUpdateAchievements(userId);

    const activeAchievementIds = await this.prisma.achievement.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true },
    });
    const achievementIds = activeAchievementIds.map((a) => a.id);

    const [userAchievements, totalUsers, completedByAchievement] =
      await Promise.all([
        this.prisma.userAchievement.findMany({
          where: {
            userId,
            deletedAt: null,
            achievementId: { in: achievementIds },
          },
          include: { achievement: true },
          orderBy: { createdAt: 'asc' },
        }),
        this.prisma.user.count({ where: { deletedAt: null } }),
        this.prisma.userAchievement.groupBy({
          by: ['achievementId'],
          where: {
            deletedAt: null,
            achievementId: { in: achievementIds },
            OR: [{ isCompleted: true }, { completionCount: { gt: 0 } }],
          },
          _count: { _all: true },
        }),
      ]);

    const completionMap = new Map<string, number>(
      completedByAchievement.map((row) => [row.achievementId, row._count._all]),
    );

    const achievements = userAchievements
      .map((ua) => {
        const completedCount = completionMap.get(ua.achievementId) ?? 0;
        const percent =
          totalUsers > 0 ? (completedCount / totalUsers) * 100 : 0;

        return {
          ...this.mapToUserAchievementDto(ua),
          globalCompletionPercent: Math.round(percent * 10) / 10,
        };
      })
      .sort((a, b) => {
        if (a.globalCompletionPercent !== b.globalCompletionPercent) {
          return b.globalCompletionPercent - a.globalCompletionPercent;
        }
        return a.achievement.name.localeCompare(b.achievement.name);
      });

    return { achievements, totalUsers };
  }

  async checkAndUpdateAchievements(userId: string): Promise<void> {
    this.logger.log(`Checking achievements for user: ${userId}`);

    // Get all active achievements
    const achievements = await this.prisma.achievement.findMany({
      where: { isActive: true, deletedAt: null },
    });

    for (const achievement of achievements) {
      await this.checkAchievement(userId, achievement);
    }
  }

  private async checkAchievement(
    userId: string,
    achievement: Achievement,
  ): Promise<void> {
    // Get or create user achievement record
    let userAchievement = await this.prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: { userId, achievementId: achievement.id },
      },
    });

    if (!userAchievement) {
      userAchievement = await this.prisma.userAchievement.create({
        data: {
          userId,
          achievementId: achievement.id,
          progress: 0,
          isCompleted: false,
          completionCount: 0,
        },
      });
    }

    // Check if already completed and not repeatable
    if (userAchievement.isCompleted && !achievement.isRepeatable) {
      return;
    }

    // Check if max completions reached
    if (userAchievement.completionCount >= achievement.maxCompletions) {
      return;
    }

    // Calculate current progress based on achievement type
    const currentProgress = await this.calculateProgress(userId, achievement);

    const updateData: any = {
      lastProgressUpdate: new Date(),
    };

    if (currentProgress >= achievement.targetValue) {
      // Achievement completed
      if (!userAchievement.isCompleted) {
        updateData.isCompleted = true;
        updateData.completedAt = new Date();
        this.logger.log(
          `Achievement ${achievement.name} completed by user ${userId}`,
        );
      }

      updateData.completionCount = userAchievement.completionCount + 1;
      updateData.progress = achievement.targetValue;

      // If repeatable, reset for next completion
      if (achievement.isRepeatable) {
        updateData.isCompleted = false;
        updateData.completedAt = null;
      }
    } else {
      updateData.progress = currentProgress;
    }

    await this.prisma.userAchievement.update({
      where: { id: userAchievement.id },
      data: updateData,
    });
  }

  private async calculateProgress(
    userId: string,
    achievement: Achievement,
  ): Promise<number> {
    switch (achievement.type) {
      case AchievementType.TOTAL_BEERS:
        return await this.calculateTotalBeers(userId);

      case AchievementType.BEERS_IN_EVENT:
        return await this.calculateBeersInEvent(userId);

      case AchievementType.BEERS_IN_HOUR:
        return await this.calculateBeersInHour(userId);

      case AchievementType.EVENTS_PARTICIPATED:
        return await this.calculateEventsParticipated(userId);

      case AchievementType.EVENT_WIN:
        return await this.calculateEventWins(userId);

      case AchievementType.FIRST_BEER:
        return await this.calculateFirstBeer(userId);

      case AchievementType.CONSECUTIVE_DAYS:
        return await this.calculateConsecutiveDays(userId);

      case AchievementType.BEER_PONG_GAMES_PLAYED:
        return await this.calculateBeerPongGamesPlayed(userId);

      case AchievementType.BEER_PONG_GAMES_WON:
        return await this.calculateBeerPongGamesWon(userId);

      case AchievementType.BEER_PONG_FINALS_WON:
        return await this.calculateBeerPongFinalsWon(userId);

      default:
        return 0;
    }
  }

  private async calculateTotalBeers(userId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    return user?.beerCount || 0;
  }

  private async calculateBeersInEvent(userId: string): Promise<number> {
    // Get the most recent event where user participated
    const recentEventBeer = await this.prisma.eventBeer.findFirst({
      where: { userId, deletedAt: null },
      orderBy: { consumedAt: 'desc' },
    });

    if (!recentEventBeer) return 0;

    return this.prisma.eventBeer.count({
      where: {
        userId,
        eventId: recentEventBeer.eventId,
        deletedAt: null,
      },
    });
  }

  private async calculateBeersInHour(userId: string): Promise<number> {
    // Get beers from the last hour
    const oneHourAgo = subHours(new Date(), 1);

    const recentBeers = await this.prisma.eventBeer.findMany({
      where: {
        userId,
        deletedAt: null,
        consumedAt: { gte: oneHourAgo },
      },
      orderBy: { consumedAt: 'asc' },
    });

    if (recentBeers.length === 0) return 0;

    // Group beers by hour and find the hour with most beers
    const hourlyCounts = new Map<number, number>();

    recentBeers.forEach((beer) => {
      const hour = new Date(beer.consumedAt).getHours();
      hourlyCounts.set(hour, (hourlyCounts.get(hour) || 0) + 1);
    });

    return Math.max(...hourlyCounts.values());
  }

  private async calculateEventsParticipated(userId: string): Promise<number> {
    return this.prisma.eventUsers.count({
      where: { userId },
    });
  }

  private async calculateEventWins(userId: string): Promise<number> {
    // Get all events where user participated
    const userEvents = await this.prisma.eventUsers.findMany({
      where: { userId },
      include: { event: true },
    });

    let wins = 0;

    for (const eventUser of userEvents) {
      // Get all users' beer counts for this event
      const eventBeers = await this.prisma.eventBeer.groupBy({
        by: ['userId'],
        where: {
          eventId: eventUser.eventId,
          deletedAt: null,
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      });

      if (eventBeers.length > 0) {
        const topUser = eventBeers[0];
        if (topUser.userId === userId) {
          wins++;
        }
      }
    }

    return wins;
  }

  private async calculateFirstBeer(userId: string): Promise<number> {
    const firstBeer = await this.prisma.eventBeer.findFirst({
      where: { userId, deletedAt: null },
      orderBy: { consumedAt: 'asc' },
    });

    return firstBeer ? 1 : 0;
  }

  private async calculateConsecutiveDays(userId: string): Promise<number> {
    // Get all beer dates for the user
    const eventBeers = await this.prisma.eventBeer.findMany({
      where: { userId, deletedAt: null },
      select: { consumedAt: true },
      orderBy: { consumedAt: 'asc' },
    });

    if (eventBeers.length === 0) return 0;

    // Extract unique dates
    const dates = new Set<string>();
    eventBeers.forEach((eb) => {
      const date = new Date(eb.consumedAt).toISOString().split('T')[0];
      dates.add(date);
    });
    const sortedDates = Array.from(dates).sort();

    let maxConsecutive = 1;
    let currentConsecutive = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);

      const diffDays = Math.floor(
        (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays === 1) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 1;
      }
    }

    return maxConsecutive;
  }

  private async calculateBeerPongGamesPlayed(userId: string): Promise<number> {
    return this.prisma.beerPongGame.count({
      where: {
        status: BeerPongGameStatus.COMPLETED,
        OR: [
          {
            team1: {
              OR: [{ player1Id: userId }, { player2Id: userId }],
            },
          },
          {
            team2: {
              OR: [{ player1Id: userId }, { player2Id: userId }],
            },
          },
        ],
      },
    });
  }

  private async calculateBeerPongGamesWon(userId: string): Promise<number> {
    return this.prisma.beerPongGame.count({
      where: {
        status: BeerPongGameStatus.COMPLETED,
        winnerTeam: {
          OR: [{ player1Id: userId }, { player2Id: userId }],
        },
      },
    });
  }

  private async calculateBeerPongFinalsWon(userId: string): Promise<number> {
    return this.prisma.beerPongGame.count({
      where: {
        status: BeerPongGameStatus.COMPLETED,
        round: BeerPongRound.FINAL,
        winnerTeam: {
          OR: [{ player1Id: userId }, { player2Id: userId }],
        },
      },
    });
  }

  private mapToUserAchievementDto(
    userAchievement: UserAchievement & { achievement: Achievement },
  ): UserAchievementDto {
    return {
      id: userAchievement.id,
      userId: userAchievement.userId,
      achievementId: userAchievement.achievementId,
      progress: userAchievement.progress,
      isCompleted: userAchievement.isCompleted,
      completedAt: userAchievement.completedAt,
      completionCount: userAchievement.completionCount,
      lastProgressUpdate: userAchievement.lastProgressUpdate,
      createdAt: userAchievement.createdAt,
      updatedAt: userAchievement.updatedAt,
      achievement: {
        id: userAchievement.achievement.id,
        name: userAchievement.achievement.name,
        description: userAchievement.achievement.description ?? null,
        type: userAchievement.achievement.type,
        category: userAchievement.achievement.category,
        targetValue: userAchievement.achievement.targetValue,
        points: userAchievement.achievement.points,
        icon: userAchievement.achievement.icon ?? null,
        isActive: userAchievement.achievement.isActive,
        isRepeatable: userAchievement.achievement.isRepeatable,
        maxCompletions: userAchievement.achievement.maxCompletions,
        createdAt: userAchievement.achievement.createdAt,
        updatedAt: userAchievement.achievement.updatedAt,
      },
    };
  }

  // Admin methods for managing achievements
  async createAchievement(
    createDto: CreateAchievementDto,
  ): Promise<AchievementDto> {
    const baseId = this.toSlug(createDto.name);
    let id = baseId;

    for (let suffix = 2; suffix < 50; suffix++) {
      const existing = await this.prisma.achievement.findUnique({
        where: { id },
      });
      if (!existing) break;
      id = `${baseId}-${suffix}`;
    }

    const saved = await this.prisma.achievement.create({
      data: {
        ...createDto,
        id,
      },
    });
    return this.mapToAchievementDto(saved);
  }

  async updateAchievement(
    id: string,
    updateDto: UpdateAchievementDto,
  ): Promise<AchievementDto> {
    await this.prisma.achievement.update({
      where: { id },
      data: updateDto,
    });
    const achievement = await this.prisma.achievement.findUnique({
      where: { id },
    });
    if (!achievement) {
      throw new Error(`Achievement with id ${id} not found`);
    }
    return this.mapToAchievementDto(achievement);
  }

  async deleteAchievement(id: string): Promise<void> {
    await this.prisma.achievement.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getAllAchievements(): Promise<AchievementDto[]> {
    const achievements = await this.prisma.achievement.findMany({
      where: { deletedAt: null },
      orderBy: [{ category: 'asc' }, { targetValue: 'asc' }],
    });
    return achievements.map((a) => this.mapToAchievementDto(a));
  }

  private mapToAchievementDto(achievement: any): AchievementDto {
    return {
      id: achievement.id,
      name: achievement.name,
      description: achievement.description ?? null,
      type: achievement.type,
      category: achievement.category,
      targetValue: achievement.targetValue,
      points: achievement.points,
      icon: achievement.icon ?? null,
      isActive: achievement.isActive,
      isRepeatable: achievement.isRepeatable,
      maxCompletions: achievement.maxCompletions,
      createdAt: achievement.createdAt,
      updatedAt: achievement.updatedAt,
    };
  }
}
