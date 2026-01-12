import {
  Injectable,
  Logger,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBeer } from '@prisma/client';
import { BeersService } from '../../beers/beers.service';
import { LeaderboardGateway } from '../../leaderboard/leaderboard.gateway';
import { LoggingService } from '../../logging/logging.service';

@Injectable()
export class EventBeersService {
  private readonly logger = new Logger(EventBeersService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => BeersService))
    private readonly beersService: BeersService,
    private readonly leaderboardGateway: LeaderboardGateway,
    private readonly loggingService: LoggingService,
  ) {}

  async create(
    eventId: string,
    userId: string,
    barrelId?: string,
  ): Promise<EventBeer> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (barrelId) {
      const barrel = await this.prisma.barrel.findUnique({
        where: { id: barrelId },
      });

      if (!barrel) {
        throw new NotFoundException(`Barrel with ID ${barrelId} not found`);
      }
    }

    // Create event-specific beer
    const savedEventBeer = await this.prisma.eventBeer.create({
      data: {
        eventId,
        userId,
        barrelId: barrelId || null,
      },
    });

    // Also create a global beer record, with skipEventBeer=true to prevent infinite loop
    await this.beersService.create(userId, barrelId, true);

    // Log beer addition
    this.loggingService.logBeerAdded(userId, barrelId);

    // Emit live updates for leaderboard and dashboard stats
    await this.leaderboardGateway.emitFullUpdate(eventId);

    return savedEventBeer;
  }

  async remove(eventId: string, userId: string): Promise<void> {
    const lastBeer = await this.prisma.eventBeer.findFirst({
      where: { eventId, userId, deletedAt: null },
      orderBy: { consumedAt: 'desc' },
    });

    if (!lastBeer) {
      throw new NotFoundException('No beers found for this user in this event');
    }

    await this.prisma.eventBeer.update({
      where: { id: lastBeer.id },
      data: { deletedAt: new Date() },
    });

    // Log beer removal
    this.loggingService.logBeerRemoved(userId, lastBeer.barrelId);

    // Emit live updates for leaderboard and dashboard stats
    await this.leaderboardGateway.emitFullUpdate(eventId);
  }

  async findByEventId(eventId: string): Promise<EventBeer[]> {
    return this.prisma.eventBeer.findMany({
      where: { eventId, deletedAt: null },
      include: { user: true, barrel: true },
    });
  }

  async findByEventAndUser(
    eventId: string,
    userId: string,
  ): Promise<EventBeer[]> {
    return this.prisma.eventBeer.findMany({
      where: { eventId, userId, deletedAt: null },
      include: { barrel: true },
    });
  }

  async getEventBeerCount(eventId: string, userId: string): Promise<number> {
    return this.prisma.eventBeer.count({
      where: { eventId, userId, deletedAt: null },
    });
  }

  async getLastEventBeerTime(
    eventId: string,
    userId: string,
  ): Promise<Date | null> {
    const lastBeer = await this.prisma.eventBeer.findFirst({
      where: { eventId, userId, deletedAt: null },
      orderBy: { consumedAt: 'desc' },
    });
    return lastBeer?.consumedAt || null;
  }

  async findAllForEvent(eventId: string): Promise<EventBeer[]> {
    return this.prisma.eventBeer.findMany({
      where: { eventId, deletedAt: null },
      orderBy: { consumedAt: 'desc' },
    });
  }

  async removeAllForEvent(eventId: string): Promise<void> {
    const eventBeers = await this.prisma.eventBeer.findMany({
      where: { eventId, deletedAt: null },
    });

    if (eventBeers.length > 0) {
      await this.prisma.eventBeer.updateMany({
        where: { eventId, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      this.logger.log(
        `Removed ${eventBeers.length} event beers for event ${eventId}`,
      );
    }
  }
}
