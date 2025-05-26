import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { Participant } from '../participants/entities/participant.entity';

@Injectable()
export class EventsService {
    constructor(
        @InjectRepository(Event)
        private eventRepository: Repository<Event>,
        @InjectRepository(Participant)
        private participantRepository: Repository<Participant>
    ) {}

    async create(createEventDto: CreateEventDto): Promise<Event> {
        // End any currently active events
        const activeEvents = await this.eventRepository.find({
            where: { isActive: true },
            relations: ['participants', 'barrels']
        });
        
        for (const activeEvent of activeEvents) {
            activeEvent.isActive = false;
            activeEvent.endDate = new Date();
            await this.eventRepository.save(activeEvent);
        }

        const event = this.eventRepository.create({
            ...createEventDto,
            isActive: true,
            startDate: new Date(createEventDto.startDate),
            participants: [],
            barrels: []
        });

        return await this.eventRepository.save(event);
    }

    async findAll(): Promise<Event[]> {
        return await this.eventRepository.find({
            relations: ['participants', 'barrels'],
            order: { createdAt: 'DESC' }
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

    async getActiveEvent(): Promise<Event | null> {
        return await this.eventRepository.findOne({
            where: { isActive: true },
            relations: ['participants', 'barrels']
        });
    }

    async addParticipant(eventId: string, participantId: string): Promise<Event> {
        const event = await this.findOne(eventId);
        const participant = await this.participantRepository.findOne({ where: { id: participantId } });
        
        if (!participant) {
            throw new NotFoundException(`Participant with ID ${participantId} not found`);
        }

        if (!event.participants) {
            event.participants = [];
        }

        // Check if participant is already in the event
        const isParticipantInEvent = event.participants.some(p => p.id === participantId);
        if (!isParticipantInEvent) {
            event.participants.push(participant);
        }

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