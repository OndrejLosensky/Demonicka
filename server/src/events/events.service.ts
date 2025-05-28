import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { User } from '../users/entities/user.entity';
import { Barrel } from '../barrels/entities/barrel.entity';
import { In } from 'typeorm';

@Injectable()
export class EventsService {
    constructor(
        @InjectRepository(Event)
        private readonly eventRepository: Repository<Event>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Barrel)
        private readonly barrelRepository: Repository<Barrel>
    ) {}

    async create(createEventDto: CreateEventDto): Promise<Event> {
        const event = this.eventRepository.create(createEventDto);
        return this.eventRepository.save(event);
    }

    async findAll(): Promise<Event[]> {
        return this.eventRepository.find({
            relations: ['users', 'barrels'],
        });
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

    async getEventUsers(id: string, withDeleted?: boolean): Promise<User[]> {
        const event = await this.eventRepository.findOne({
            where: { id },
            relations: ['users'],
            withDeleted: withDeleted
        });
        if (!event) {
            throw new NotFoundException(`Event with ID ${id} not found`);
        }
        
        // If withDeleted is true, return all users including deleted ones
        if (withDeleted) {
            const userIds = event.users.map(user => user.id);
            return this.userRepository.find({
                where: { id: In(userIds) },
                withDeleted: true
            });
        }
        
        return event.users || [];
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

    async getEventBarrels(id: string): Promise<Barrel[]> {
        const event = await this.eventRepository.findOne({
            where: { id },
            relations: ['barrels']
        });
        if (!event) {
            throw new NotFoundException(`Event with ID ${id} not found`);
        }
        return event.barrels || [];
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
} 