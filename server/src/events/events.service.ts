import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { Participant } from '../participants/entities/participant.entity';
import { Barrel } from '../barrels/entities/barrel.entity';

@Injectable()
export class EventsService {
    constructor(
        @InjectRepository(Event)
        private eventRepository: Repository<Event>,
        @InjectRepository(Participant)
        private participantRepository: Repository<Participant>,
        @InjectRepository(Barrel)
        private barrelRepository: Repository<Barrel>
    ) {}

    async create(createEventDto: CreateEventDto): Promise<Event> {
        // End any currently active event
        const activeEvent = await this.getActiveEvent();
        if (activeEvent) {
            activeEvent.isActive = false;
            activeEvent.endDate = new Date();
            await this.eventRepository.save(activeEvent);
        }

        // Create new event
        const event = this.eventRepository.create({
            ...createEventDto,
            startDate: new Date(createEventDto.startDate),
            isActive: true
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

    async getEventParticipants(eventId: string): Promise<Participant[]> {
        const event = await this.eventRepository.findOne({
            where: { id: eventId },
            relations: ['participants']
        });
        if (!event) {
            throw new NotFoundException(`Event with ID ${eventId} not found`);
        }
        return event.participants || [];
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
        const barrel = await this.barrelRepository.findOne({ where: { id: barrelId } });
        
        if (!barrel) {
            throw new NotFoundException(`Barrel with ID ${barrelId} not found`);
        }

        if (!event.barrels) {
            event.barrels = [];
        }

        // Check if barrel is already in the event
        const isBarrelInEvent = event.barrels.some(b => b.id === barrelId);
        if (!isBarrelInEvent) {
            event.barrels.push(barrel);
        }

        return await this.eventRepository.save(event);
    }

    async endEvent(id: string): Promise<Event> {
        const event = await this.findOne(id);
        event.isActive = false;
        event.endDate = new Date();
        return await this.eventRepository.save(event);
    }

    async makeEventActive(id: string): Promise<Event> {
        // End any currently active event
        const activeEvent = await this.getActiveEvent();
        if (activeEvent && activeEvent.id !== id) {
            activeEvent.isActive = false;
            activeEvent.endDate = new Date();
            await this.eventRepository.save(activeEvent);
        }

        // Make the specified event active
        const event = await this.findOne(id);
        event.isActive = true;
        event.endDate = null; // Clear end date if it was previously ended
        return await this.eventRepository.save(event);
    }
} 