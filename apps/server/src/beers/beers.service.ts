import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Beer } from '@prisma/client';
import { EventsService } from '../events/events.service';
import { EventBeersService } from '../events/services/event-beers.service';
import { LoggingService } from '../logging/logging.service';
import { AchievementsService } from '../achievements/achievements.service';

@Injectable()
export class BeersService {
  private readonly logger = new Logger(BeersService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => EventsService))
    private readonly eventsService: EventsService,
    @Inject(forwardRef(() => EventBeersService))
    private readonly eventBeersService: EventBeersService,
    private readonly loggingService: LoggingService,
    private readonly achievementsService: AchievementsService,
  ) {}

  async create(
    userId: string,
    barrelId?: string,
    skipEventBeer = false,
  ): Promise<Beer> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    let barrelIdToUse: string | null = null;
    if (barrelId) {
      const barrel = await this.prisma.barrel.findUnique({
        where: { id: barrelId },
      });

      if (!barrel) {
        throw new Error('Barrel not found');
      }
      barrelIdToUse = barrel.id;
    }

    // Create global beer record
    const savedBeer = await this.prisma.beer.create({
      data: {
        userId,
        barrelId: barrelIdToUse,
      },
    });

    // Update user's beer count and last beer time
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        beerCount: (user.beerCount || 0) + 1,
        lastBeerTime: new Date(),
      },
    });

    // Check for active event and create event beer if user is participant
    if (!skipEventBeer) {
      try {
        const activeEvent = await this.eventsService.getActiveEvent();
        if (activeEvent) {
          const eventUsers = await this.eventsService.getEventUsers(
            activeEvent.id,
          );
          if (eventUsers.some((u) => u.id === userId)) {
            await this.eventBeersService.create(
              activeEvent.id,
              userId,
              barrelId,
            );
          }
        }
      } catch (error) {
        this.logger.error('Failed to create event beer:', error);
        // Don't throw the error as the global beer was already created successfully
      }
    }

    // Log beer addition
    this.loggingService.logBeerAdded(userId, barrelId);

    // Check achievements
    try {
      await this.achievementsService.checkAndUpdateAchievements(userId);
    } catch (error) {
      this.logger.error('Failed to check achievements:', error);
      // Don't throw the error as the beer was already created successfully
    }

    return savedBeer;
  }

  async findByUserId(userId: string): Promise<Beer[]> {
    return this.prisma.beer.findMany({
      where: { userId, deletedAt: null },
      include: { barrel: true },
    });
  }

  async findAll(): Promise<Beer[]> {
    return this.prisma.beer.findMany({
      where: { deletedAt: null },
      include: { user: true, barrel: true },
    });
  }

  async findOne(id: string): Promise<Beer | null> {
    return this.prisma.beer.findUnique({
      where: { id },
      include: { user: true, barrel: true },
    });
  }

  async getUserBeerCount(userId: string): Promise<number> {
    return this.prisma.beer.count({
      where: { userId, deletedAt: null },
    });
  }

  async getLastBeerTime(userId: string): Promise<Date | null> {
    const lastBeer = await this.prisma.beer.findFirst({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return lastBeer?.createdAt || null;
  }

  async remove(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Find the last beer for this user
    const lastBeer = await this.prisma.beer.findFirst({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!lastBeer) {
      throw new Error('No beers found for this user');
    }

    // Remove the last beer (soft delete)
    await this.prisma.beer.update({
      where: { id: lastBeer.id },
      data: { deletedAt: new Date() },
    });

    // Update user's beer count
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        beerCount: Math.max(0, (user.beerCount || 0) - 1),
      },
    });

    // Log beer removal
    this.loggingService.logBeerRemoved(userId, lastBeer.barrelId);
  }
}
