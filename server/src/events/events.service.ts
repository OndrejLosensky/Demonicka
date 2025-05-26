import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventsService {
    constructor(
        @InjectRepository(Event)
        private eventRepository: Repository<Event>
    ) {}

    async create(createEventDto: CreateEventDto): Promise<Event> {
        const event = this.eventRepository.create(createEventDto);
        return await this.eventRepository.save(event);
    }

    async findAll(): Promise<Event[]> {
        return await this.eventRepository.find({
            relations: ['participants', 'barrels']
        });
    }

    async findOne(id: string): Promise<Event> {
        const event = await this.eventRepository.findOne({
            where: { id },
            relations: ['participants', 'barrels']
        });
        if (!event) {
            throw new NotFoundException(`Event with ID ${id} not found`);
        }
        return event;
    }

    async addParticipant(eventId: string, userId: string): Promise<Event> {
        const event = await this.findOne(eventId);
        event.participants = [...(event.participants || []), { id: userId } as any];
        return await this.eventRepository.save(event);
    }

    async addBarrel(eventId: string, barrelId: string): Promise<Event> {
        const event = await this.findOne(eventId);
        event.barrels = [...(event.barrels || []), { id: barrelId } as any];
        return await this.eventRepository.save(event);
    }

    async endEvent(id: string): Promise<Event> {
        const event = await this.findOne(id);
        event.isActive = false;
        event.endDate = new Date();
        return await this.eventRepository.save(event);
    }
} 