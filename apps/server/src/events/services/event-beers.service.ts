import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBeer } from '@prisma/client';
import { BeersService } from '../../beers/beers.service';
import { BarrelsService } from '../../barrels/barrels.service';
import { LeaderboardGateway } from '../../leaderboard/leaderboard.gateway';
import { LoggingService } from '../../logging/logging.service';
import { isEventCompleted } from '../utils/event-completion.util';

@Injectable()
export class EventBeersService {
  private readonly logger = new Logger(EventBeersService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => BeersService))
    private readonly beersService: BeersService,
    private readonly barrelsService: BarrelsService,
    private readonly leaderboardGateway: LeaderboardGateway,
    private readonly loggingService: LoggingService,
  ) {}

  async create(
    eventId: string,
    userId: string,
    barrelId?: string,
    actorUserId?: string,
    spilled = false,
    beerSize: 'SMALL' | 'LARGE' = 'LARGE',
    volumeLitres: number = 0.5,
  ): Promise<EventBeer> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Check if event is completed
    if (isEventCompleted(event)) {
      throw new BadRequestException(
        `Cannot create beer for completed event "${event.name}"`,
      );
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
        spilled,
        beerSize,
        volumeLitres,
      },
    });

    // Also create a global beer record, with skipEventBeer=true to prevent infinite loop
    await this.beersService.create(userId, barrelId, true, beerSize, volumeLitres);

    // Update barrel litres if barrel is provided
    if (barrelId) {
      this.logger.debug(`Decrementing barrel ${barrelId} by ${volumeLitres}L (beerSize: ${beerSize})`);
      await this.barrelsService.decrementLitres(barrelId, volumeLitres);
    }

    // Log beer addition
    this.loggingService.logBeerAdded(userId, barrelId, {
      actorUserId,
      eventId,
    });

    // Emit live updates for leaderboard and dashboard stats immediately
    // Don't await to avoid blocking the response - fire and forget
    this.leaderboardGateway.emitFullUpdate(eventId).catch((error) => {
      console.error('Failed to emit leaderboard update after beer creation:', error);
    });

    return savedEventBeer;
  }

  async remove(
    eventId: string,
    userId: string,
    actorUserId?: string,
  ): Promise<void> {
    // Check if event is completed
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }
    if (isEventCompleted(event)) {
      throw new BadRequestException(
        `Cannot remove beer from completed event "${event.name}"`,
      );
    }

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
    this.loggingService.logBeerRemoved(userId, lastBeer.barrelId, {
      actorUserId,
      eventId,
    });

    // Emit live updates for leaderboard and dashboard stats immediately
    // Don't await to avoid blocking the response - fire and forget
    this.leaderboardGateway.emitFullUpdate(eventId).catch((error) => {
      console.error('Failed to emit leaderboard update after beer removal:', error);
    });
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
    includeDeleted = false,
  ): Promise<EventBeer[]> {
    const where: { eventId: string; userId: string; deletedAt?: null } = {
      eventId,
      userId,
    };
    if (!includeDeleted) {
      where.deletedAt = null;
    }
    return this.prisma.eventBeer.findMany({
      where,
      include: { barrel: true },
      orderBy: { consumedAt: 'desc' },
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
    // Check if event is completed
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }
    if (isEventCompleted(event)) {
      throw new BadRequestException(
        `Cannot remove beers from completed event "${event.name}"`,
      );
    }

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
