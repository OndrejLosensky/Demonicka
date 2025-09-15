import {
  Injectable,
  Logger,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventBeer } from '../entities/event-beer.entity';
import { User } from '../../users/entities/user.entity';
import { Event } from '../entities/event.entity';
import { Barrel } from '../../barrels/entities/barrel.entity';
import { BeersService } from '../../beers/beers.service';
import { LeaderboardGateway } from '../../leaderboard/leaderboard.gateway';
import { LoggingService } from '../../logging/logging.service';

@Injectable()
export class EventBeersService {
  private readonly logger = new Logger(EventBeersService.name);

  constructor(
    @InjectRepository(EventBeer)
    private readonly eventBeerRepository: Repository<EventBeer>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Barrel)
    private readonly barrelRepository: Repository<Barrel>,
    @Inject(forwardRef(() => BeersService))
    private readonly beersService: BeersService,
    private readonly leaderboardGateway: LeaderboardGateway,
    private readonly loggingService: LoggingService,
  ) {}

  async create(
    eventId: string,
    userId: string,
    barrelId?: string,
    spilled: boolean = false,
  ): Promise<EventBeer> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    let barrel: Barrel | null = null;
    if (barrelId) {
      barrel = await this.barrelRepository.findOne({
        where: { id: barrelId },
      });

      if (!barrel) {
        throw new NotFoundException(`Barrel with ID ${barrelId} not found`);
      }
    }

    // Create event-specific beer
    const eventBeer = this.eventBeerRepository.create({
      eventId,
      userId,
      barrelId: barrel?.id || null,
      spilled,
    });

    const savedEventBeer = await this.eventBeerRepository.save(eventBeer);

    // Also create a global beer record, with skipEventBeer=true to prevent infinite loop
    await this.beersService.create(userId, barrelId, true);

    // Log beer addition
    this.loggingService.logBeerAdded(userId, barrelId);

    // Emit live updates for leaderboard and dashboard stats
    await this.leaderboardGateway.emitFullUpdate(eventId);

    return savedEventBeer;
  }

  async remove(eventId: string, userId: string): Promise<void> {
    const lastBeer = await this.eventBeerRepository.findOne({
      where: { eventId, userId },
      order: { consumedAt: 'DESC' },
    });

    if (!lastBeer) {
      throw new NotFoundException('No beers found for this user in this event');
    }

    await this.eventBeerRepository.remove(lastBeer);

    // Log beer removal
    this.loggingService.logBeerRemoved(userId, lastBeer.barrelId);

    // Emit live updates for leaderboard and dashboard stats
    await this.leaderboardGateway.emitFullUpdate(eventId);
  }

  async findByEventId(eventId: string): Promise<EventBeer[]> {
    return this.eventBeerRepository.find({
      where: { eventId },
      relations: ['user', 'barrel'],
    });
  }

  async findByEventAndUser(
    eventId: string,
    userId: string,
  ): Promise<EventBeer[]> {
    return this.eventBeerRepository.find({
      where: { eventId, userId },
      relations: ['barrel'],
    });
  }

  async getEventBeerCount(eventId: string, userId: string): Promise<number> {
    const beers = await this.eventBeerRepository.find({
      where: { eventId, userId },
    });
    return beers.length;
  }

  async getLastEventBeerTime(
    eventId: string,
    userId: string,
  ): Promise<Date | null> {
    const lastBeer = await this.eventBeerRepository.findOne({
      where: { eventId, userId },
      order: { consumedAt: 'DESC' },
    });
    return lastBeer?.consumedAt || null;
  }

  async findAllForEvent(eventId: string): Promise<EventBeer[]> {
    return this.eventBeerRepository.find({
      where: { eventId },
      order: { consumedAt: 'DESC' },
    });
  }

  async removeAllForEvent(eventId: string): Promise<void> {
    const eventBeers = await this.eventBeerRepository.find({
      where: { eventId },
    });

    if (eventBeers.length > 0) {
      await this.eventBeerRepository.remove(eventBeers);
      this.logger.log(
        `Removed ${eventBeers.length} event beers for event ${eventId}`,
      );
    }
  }
}
