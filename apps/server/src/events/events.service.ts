import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Event as PrismaEvent, User, Barrel, UserRole } from '@prisma/client';
import type { Event } from '@demonicka/shared-types';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventBeersService } from './services/event-beers.service';
import { BarrelsService } from '../barrels/barrels.service';
import { LoggingService } from '../logging/logging.service';
import { UsersService } from '../users/users.service';
import { userCanAccessEvent } from '../auth/guards/permissions.guard';

@Injectable()
export class EventsService {
    constructor(
        private prisma: PrismaService,
        private readonly eventBeersService: EventBeersService,
        private readonly barrelsService: BarrelsService,
        private readonly loggingService: LoggingService,
        private readonly usersService: UsersService,
    ) {}

    async create(createEventDto: CreateEventDto, userId: string): Promise<Event> {
        const created = await this.prisma.event.create({
            data: {
                ...createEventDto,
                createdBy: userId,
            },
            include: {
                users: { include: { user: true } },
                barrels: { include: { barrel: true } },
            },
        });

        this.loggingService.logEventCreated(created.id, created.name, userId);
        
        // Transform EventBarrels[] to Barrel[] and EventUsers[] to User[] for consistent API response
        // NestJS will automatically serialize Date objects to ISO strings in JSON responses
        return {
            ...created,
            description: created.description ?? undefined,
            startDate: created.startDate.toISOString(),
            endDate: created.endDate?.toISOString() ?? undefined,
            createdAt: created.createdAt.toISOString(),
            updatedAt: created.updatedAt.toISOString(),
            deletedAt: created.deletedAt?.toISOString() ?? undefined,
            users: created.users.map(eu => eu.user),
            barrels: created.barrels.map(eb => eb.barrel),
        } as unknown as Event;
    }

    async findAll(user?: User): Promise<Event[]> {
        const where: any = { deletedAt: null };

        // If user is provided, filter based on role
        if (user) {
            if (user.role === UserRole.SUPER_ADMIN) {
                // SUPER_ADMIN sees all events
                // No additional filtering needed
            } else if (user.role === UserRole.OPERATOR) {
                // OPERATOR sees events they created or are part of
                const eventIds = await this.prisma.eventUsers.findMany({
                    where: { userId: user.id },
                    select: { eventId: true },
                });
                const participantEventIds = eventIds.map(eu => eu.eventId);

                where.OR = [
                    { createdBy: user.id },
                    { id: { in: participantEventIds } },
                ];
            } else {
                // USER and PARTICIPANT see only events they're part of
                const eventIds = await this.prisma.eventUsers.findMany({
                    where: { userId: user.id },
                    select: { eventId: true },
                });
                const participantEventIds = eventIds.map(eu => eu.eventId);

                where.id = { in: participantEventIds };
            }
        }

        const events = await this.prisma.event.findMany({
            where,
            include: {
                users: { include: { user: true } },
                barrels: { include: { barrel: true } },
            },
        });
        
        // Transform EventBarrels[] to Barrel[] and EventUsers[] to User[] for consistent API response
        // NestJS will automatically serialize Date objects to ISO strings in JSON responses
        return events.map(event => ({
            ...event,
            description: event.description ?? undefined,
            startDate: event.startDate.toISOString(),
            endDate: event.endDate?.toISOString() ?? undefined,
            createdAt: event.createdAt.toISOString(),
            updatedAt: event.updatedAt.toISOString(),
            deletedAt: event.deletedAt?.toISOString() ?? undefined,
            users: event.users.map(eu => eu.user),
            barrels: event.barrels.map(eb => eb.barrel),
        })) as unknown as Event[];
    }

    async findOne(id: string, user?: User): Promise<Event> {
        const event = await this.prisma.event.findUnique({
            where: { id },
            include: {
                users: { include: { user: true } },
                barrels: { include: { barrel: true } },
            },
        });

        if (!event) {
            throw new NotFoundException(`Event with ID ${id} not found`);
        }

        // Check access if user is provided
        if (user && !userCanAccessEvent(user, event)) {
            throw new ForbiddenException('You do not have access to this event');
        }

        // Transform EventBarrels[] to Barrel[] and EventUsers[] to User[] for consistent API response
        // NestJS will automatically serialize Date objects to ISO strings in JSON responses
        return {
            ...event,
            description: event.description ?? undefined,
            startDate: event.startDate.toISOString(),
            endDate: event.endDate?.toISOString() ?? undefined,
            createdAt: event.createdAt.toISOString(),
            updatedAt: event.updatedAt.toISOString(),
            deletedAt: event.deletedAt?.toISOString() ?? undefined,
            users: event.users.map(eu => eu.user),
            barrels: event.barrels.map(eb => eb.barrel),
        } as unknown as Event;
    }

    async update(id: string, updateEventDto: UpdateEventDto, user?: User): Promise<Event> {
        const event = await this.findOne(id, user); // Verify event exists and check access
        
        // Check ownership for OPERATOR (SUPER_ADMIN can update any event)
        if (user && user.role === UserRole.OPERATOR && event.createdBy !== user.id) {
            throw new ForbiddenException('You can only update events you created');
        }

        await this.prisma.event.update({
            where: { id },
            data: updateEventDto,
        });
        
        return this.findOne(id, user);
    }

    async remove(id: string, user?: User): Promise<void> {
        // Only SUPER_ADMIN can delete events (permission check is done by guard)
        const event = await this.findOne(id, user); // Verify event exists and check access

        await this.prisma.event.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    async setActive(id: string, actorUserId?: string): Promise<Event> {
        // First, find the currently active event
        const activeEvent = await this.prisma.event.findFirst({
            where: { isActive: true, deletedAt: null },
        });

        // If there is an active event, deactivate it
        if (activeEvent) {
            await this.prisma.event.update({
                where: { id: activeEvent.id },
                data: { isActive: false },
            });
        }

        // Then activate the specified event
        await this.prisma.event.update({
            where: { id },
            data: { isActive: true },
        });

        if (actorUserId) {
            this.loggingService.logEventSetActive(id, actorUserId, activeEvent?.id);
        }
        
        return this.findOne(id);
    }

    async endEvent(id: string): Promise<Event> {
        await this.prisma.event.update({
            where: { id },
            data: {
                isActive: false,
                endDate: new Date(),
            },
        });
        
        return this.findOne(id);
    }

    async deactivate(id: string): Promise<Event> {
        await this.prisma.event.update({
            where: { id },
            data: { isActive: false },
        });
        
        return this.findOne(id);
    }

    async getActiveEvent(): Promise<Event | null> {
        const event = await this.prisma.event.findFirst({
            where: { isActive: true, deletedAt: null },
            include: {
                users: { include: { user: true } },
                barrels: { include: { barrel: true } },
            },
        });
        
        if (!event) {
            return null;
        }
        
        // Transform EventBarrels[] to Barrel[] and EventUsers[] to User[] for consistent API response
        // NestJS will automatically serialize Date objects to ISO strings in JSON responses
        return {
            ...event,
            description: event.description ?? undefined,
            startDate: event.startDate.toISOString(),
            endDate: event.endDate?.toISOString() ?? undefined,
            createdAt: event.createdAt.toISOString(),
            updatedAt: event.updatedAt.toISOString(),
            deletedAt: event.deletedAt?.toISOString() ?? undefined,
            users: event.users.map(eu => eu.user),
            barrels: event.barrels.map(eb => eb.barrel),
        } as unknown as Event;
    }

    async getEventUsers(id: string, withDeleted?: boolean): Promise<(User & { eventBeerCount: number })[]> {
        const event = await this.prisma.event.findUnique({
            where: { id },
            include: {
                users: { include: { user: true } },
                eventBeers: true,
            },
        });
        if (!event) {
            throw new NotFoundException(`Event with ID ${id} not found`);
        }
        
        // Get user IDs from event users
        const userIds = event.users.map(eu => eu.userId);
        
        // Fetch users (with or without deleted)
        const users = await this.prisma.user.findMany({
            where: {
                id: { in: userIds },
                ...(withDeleted ? {} : { deletedAt: null }),
            },
        });

        // Add event beer counts to each user
        return users.map(user => ({
            ...user,
            eventBeerCount: event.eventBeers.filter(eb => eb.userId === user.id && !eb.deletedAt).length
        }));
    }

    async addUser(id: string, userId: string, actorUserId?: string): Promise<Event> {
        await this.findOne(id);
        await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

        // Check if user is already in event
        const existing = await this.prisma.eventUsers.findUnique({
            where: {
                eventId_userId: { eventId: id, userId },
            },
        });

        if (!existing) {
            await this.prisma.eventUsers.create({
                data: { eventId: id, userId },
            });

            if (actorUserId) {
                this.loggingService.logParticipantAdded(id, userId, actorUserId);
            }
        }

        return this.findOne(id);
    }

    async removeUser(id: string, userId: string): Promise<Event> {
        await this.findOne(id);
        await this.prisma.eventUsers.deleteMany({
            where: { eventId: id, userId },
        });
        return this.findOne(id);
    }

    async getEventBarrels(id: string): Promise<Barrel[]> {
        const event = await this.prisma.event.findUnique({
            where: { id },
            include: { barrels: { include: { barrel: true } } },
        });
        if (!event) {
            throw new NotFoundException(`Event with ID ${id} not found`);
        }
        return event.barrels.map(eb => eb.barrel);
    }

    async addBarrel(id: string, barrelId: string, actorUserId?: string): Promise<Event> {
        await this.findOne(id);
        await this.prisma.barrel.findUniqueOrThrow({ where: { id: barrelId } });

        // Check if barrel is already in event
        const existing = await this.prisma.eventBarrels.findUnique({
            where: {
                eventId_barrelId: { eventId: id, barrelId },
            },
        });

        if (!existing) {
            await this.prisma.eventBarrels.create({
                data: { eventId: id, barrelId },
            });

            if (actorUserId) {
                this.loggingService.logBarrelAdded(id, barrelId, actorUserId);
            }
        }

        return this.findOne(id);
    }

    async removeBarrel(id: string, barrelId: string): Promise<Event> {
        await this.findOne(id);
        await this.prisma.eventBarrels.deleteMany({
            where: { eventId: id, barrelId },
        });
        return this.findOne(id);
    }

    async findUserEvents(userId: string): Promise<Event[]> {
        const eventUsers = await this.prisma.eventUsers.findMany({
            where: { userId },
            include: { 
                event: {
                    include: {
                        users: { include: { user: true } },
                        barrels: { include: { barrel: true } },
                    },
                },
            },
        });
        // Transform EventBarrels[] to Barrel[] and EventUsers[] to User[] for consistent API response
        // NestJS will automatically serialize Date objects to ISO strings in JSON responses
        return eventUsers
            .map(eu => eu.event)
            .filter(e => !e.deletedAt)
            .map(event => ({
                ...event,
                description: event.description ?? undefined,
                startDate: event.startDate.toISOString(),
                endDate: event.endDate?.toISOString() ?? undefined,
                createdAt: event.createdAt.toISOString(),
                updatedAt: event.updatedAt.toISOString(),
                deletedAt: event.deletedAt?.toISOString() ?? undefined,
                users: event.users.map(eu => eu.user),
                barrels: event.barrels.map(eb => eb.barrel),
            })) as unknown as Event[];
    }

    async addBeer(eventId: string, userId: string, actorUserId?: string): Promise<void> {
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
            await this.eventBeersService.create(eventId, userId, barrelId, actorUserId);
        } catch (error: unknown) {
            this.loggingService.error('Failed to add beer to event', {
                error: error instanceof Error ? error.message : String(error),
                eventId,
                userId,
            });
            throw error;
        }
    }

    async cleanup(): Promise<void> {
        const events = await this.prisma.event.findMany({
            where: { deletedAt: null },
        });
        
        for (const event of events) {
            try {
                // Remove all event beers first
                await this.eventBeersService.removeAllForEvent(event.id);
                
                // Remove the event (soft delete)
                await this.prisma.event.update({
                    where: { id: event.id },
                    data: { deletedAt: new Date() },
                });
            } catch (error) {
                console.error(`Failed to cleanup event ${event.id}:`, error);
            }
        }
        
        this.loggingService.logCleanup('ALL', { eventsDeleted: events.length });
    }
}
