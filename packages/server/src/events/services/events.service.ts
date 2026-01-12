import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../entities/event.entity';
import { EventBeersService } from './event-beers.service';
import { BarrelsService } from '../../barrels/barrels.service';
import { LoggingService } from '../../logging/logging.service';
import { UsersService } from '../../users/users.service';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    private readonly eventBeersService: EventBeersService,
    private readonly barrelsService: BarrelsService,
    private readonly loggingService: LoggingService,
    private readonly usersService: UsersService,
  ) {}

  async findOne(id: string): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: ['users', 'barrels'],
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }

  async addBeer(eventId: string, userId: string): Promise<void> {
    try {
      await this.findOne(eventId);
      await this.usersService.findOne(userId);

      // Get active barrel
      const activeBarrel = await this.barrelsService.getActiveBarrel();
      let barrelId: string | undefined = undefined;

      if (activeBarrel) {
        // If there is an active barrel, use it and decrement its beers
        barrelId = activeBarrel.id;
        await this.barrelsService.decrementBeers(activeBarrel.id);
      }

      // Create event beer
      await this.eventBeersService.create(eventId, userId, barrelId);

      this.loggingService.logBeerAdded(userId, barrelId);
    } catch (error: unknown) {
      this.loggingService.error('Failed to add beer to event', {
        error: error instanceof Error ? error.message : String(error),
        eventId,
        userId,
      });
      throw error;
    }
  }
} 