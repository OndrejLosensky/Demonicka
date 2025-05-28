import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { User } from '../users/entities/user.entity';
import { Barrel } from '../barrels/entities/barrel.entity';

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
        // First, deactivate all events
        await this.eventRepository.update({ isActive: true }, { isActive: false });

        // Create and activate the new event
        const event = this.eventRepository.create({
            ...createEventDto,
            isActive: true,
            users: [],
            barrels: []
        });
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

    async addUser(eventId: string, userId: string): Promise<Event> {
        const event = await this.findOne(eventId);
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

    async removeUser(eventId: string, userId: string): Promise<Event> {
        const event = await this.findOne(eventId);
        
        if (!event.users) {
            return event;
        }

        event.users = event.users.filter((u) => u.id !== userId);
        return this.eventRepository.save(event);
    }

    async getActiveEvent(): Promise<Event | null> {
        return this.eventRepository.findOne({
            where: { isActive: true },
            relations: ['users', 'barrels'],
        });
    }

    async setActiveEvent(id: string): Promise<Event> {
        // First, deactivate all currently active events
        await this.eventRepository.update({ isActive: true }, { isActive: false });

        // Then activate the specified event
        const event = await this.findOne(id);
        event.isActive = true;
        return this.eventRepository.save(event);
    }

    async getEventUsers(eventId: string): Promise<User[]> {
        const event = await this.eventRepository.findOne({
            where: { id: eventId },
            relations: ['users']
        });
        if (!event) {
            throw new NotFoundException(`Event with ID ${eventId} not found`);
        }
        return event.users || [];
    }

    async getEventBarrels(eventId: string): Promise<Barrel[]> {
        const event = await this.eventRepository.findOne({
            where: { id: eventId },
            relations: ['barrels']
        });
        if (!event) {
            throw new NotFoundException(`Event with ID ${eventId} not found`);
        }
        return event.barrels || [];
    }

    async addBarrel(eventId: string, barrelId: string): Promise<Event> {
        const event = await this.findOne(eventId);
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

    async endEvent(id: string): Promise<Event> {
        const event = await this.findOne(id);
        event.isActive = false;
        event.endDate = new Date();
        return this.eventRepository.save(event);
    }
} 