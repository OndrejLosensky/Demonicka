import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { User } from '../users/entities/user.entity';
import { Barrel } from '../barrels/entities/barrel.entity';
import { EventBeersService } from './services/event-beers.service';
import { BarrelsService } from '../barrels/barrels.service';
import { LoggingService } from '../logging/logging.service';
import { UsersService } from '../users/users.service';
import { PaginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Barrel)
    private readonly barrelRepository: Repository<Barrel>,
    private readonly eventBeersService: EventBeersService,
    private readonly barrelsService: BarrelsService,
    private readonly loggingService: LoggingService,
    private readonly usersService: UsersService,
  ) {}

  async create(createEventDto: CreateEventDto): Promise<Event> {
    const event = this.eventRepository.create(createEventDto);
    return this.eventRepository.save(event);
  }

  async findAll(take = 20, skip = 0): Promise<PaginatedResponse<Event>> {
    const [events, total] = await this.eventRepository.findAndCount({
      relations: ['users', 'barrels', 'eventBeers'],
      order: { startDate: 'DESC' },
      take,
      skip,
    });

    const totalPages = Math.ceil(total / take);
    const page = Math.floor(skip / take) + 1;

    return {
      data: events,
      total,
      page,
      pageSize: take,
      totalPages,
    };
  }

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

  async update(id: string, updateEventDto: UpdateEventDto): Promise<Event> {
    const event = await this.findOne(id);
    Object.assign(event, updateEventDto);
    return this.eventRepository.save(event);
  }

  async remove(id: string): Promise<void> {
    const event = await this.findOne(id);
    await this.eventRepository.remove(event);
  }

  async setActive(id: string): Promise<Event> {
    // First, find the currently active event
    const activeEvent = await this.eventRepository.findOne({
      where: { isActive: true }
    });

    // If there is an active event, deactivate it
    if (activeEvent) {
      activeEvent.isActive = false;
      await this.eventRepository.save(activeEvent);
    }

    // Then activate the specified event
    const event = await this.findOne(id);
    event.isActive = true;
    return this.eventRepository.save(event);
  }

  async endEvent(id: string): Promise<Event> {
    const event = await this.findOne(id);
    event.isActive = false;
    event.endDate = new Date();
    return this.eventRepository.save(event);
  }

  async getActiveEvent(): Promise<Event | null> {
    return this.eventRepository.findOne({
      where: { isActive: true },
      relations: ['users', 'barrels'],
    });
  }

  async getEventUsers(eventId: string, withDeleted = false, take = 20, skip = 0): Promise<PaginatedResponse<User>> {
    const event = await this.findOne(eventId);
    const [users, total] = await this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.users', 'user')
      .where('event.id = :eventId', { eventId })
      .andWhere(withDeleted ? '1=1' : 'user.deletedAt IS NULL')
      .orderBy('user.username', 'ASC')
      .take(take)
      .skip(skip)
      .getManyAndCount();

    const totalPages = Math.ceil(total / take);
    const page = Math.floor(skip / take) + 1;

    return {
      data: users[0]?.users || [],
      total,
      page,
      pageSize: take,
      totalPages,
    };
  }

  async addUser(id: string, userId: string): Promise<Event> {
    const event = await this.findOne(id);
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (!event.users) {
      event.users = [];
    }

    if (!event.users.some((u) => u.id === userId)) {
      event.users.push(user);
      await this.eventRepository.save(event);
    }

    return event;
  }

  async removeUser(id: string, userId: string): Promise<Event> {
    const event = await this.findOne(id);
    event.users = event.users.filter((user) => user.id !== userId);
    return this.eventRepository.save(event);
  }

  async getEventBarrels(eventId: string, take = 20, skip = 0): Promise<PaginatedResponse<Barrel>> {
    const event = await this.findOne(eventId);
    const [barrels, total] = await this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.barrels', 'barrel')
      .where('event.id = :eventId', { eventId })
      .orderBy('barrel.orderNumber', 'ASC')
      .take(take)
      .skip(skip)
      .getManyAndCount();

    const totalPages = Math.ceil(total / take);
    const page = Math.floor(skip / take) + 1;

    return {
      data: barrels[0]?.barrels || [],
      total,
      page,
      pageSize: take,
      totalPages,
    };
  }

  async addBarrel(id: string, barrelId: string): Promise<Event> {
    const event = await this.findOne(id);
    const barrel = await this.barrelRepository.findOne({
      where: { id: barrelId },
    });

    if (!barrel) {
      throw new NotFoundException(`Barrel with ID ${barrelId} not found`);
    }

    if (!event.barrels) {
      event.barrels = [];
    }

    if (!event.barrels.some((b) => b.id === barrelId)) {
      event.barrels.push(barrel);
      await this.eventRepository.save(event);
    }

    return event;
  }

  async removeBarrel(id: string, barrelId: string): Promise<Event> {
    const event = await this.findOne(id);
    event.barrels = event.barrels.filter((barrel) => barrel.id !== barrelId);
    return this.eventRepository.save(event);
  }

  async findUserEvents(userId: string): Promise<Event[]> {
    return this.eventRepository
      .createQueryBuilder('event')
      .innerJoin('event.participants', 'participant')
      .where('participant.id = :userId', { userId })
      .getMany();
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