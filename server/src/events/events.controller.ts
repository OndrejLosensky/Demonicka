import { Controller, Get, Post, Body, Param, Put, UseGuards } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { Event } from './entities/event.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Versions } from '../versioning/decorators/version.decorator';
import { VersionGuard } from '../versioning/guards/version.guard';

@Controller('events')
@Versions('1')
@UseGuards(JwtAuthGuard, VersionGuard)
export class EventsController {
    constructor(private readonly eventsService: EventsService) {}

    @Post()
    create(@Body() createEventDto: CreateEventDto): Promise<Event> {
        return this.eventsService.create(createEventDto);
    }

    @Get()
    findAll(): Promise<Event[]> {
        return this.eventsService.findAll();
    }

    @Get('active')
    getActiveEvent(): Promise<Event | null> {
        return this.eventsService.getActiveEvent();
    }

    @Get(':id')
    findOne(@Param('id') id: string): Promise<Event> {
        return this.eventsService.findOne(id);
    }

    @Get(':id/participants')
    getEventParticipants(@Param('id') id: string) {
        return this.eventsService.getEventParticipants(id);
    }

    @Get(':id/barrels')
    getEventBarrels(@Param('id') id: string) {
        return this.eventsService.getEventBarrels(id);
    }

    @Put(':id/participants/:participantId')
    addParticipant(
        @Param('id') id: string,
        @Param('participantId') participantId: string
    ): Promise<Event> {
        return this.eventsService.addParticipant(id, participantId);
    }

    @Put(':id/barrels/:barrelId')
    addBarrel(
        @Param('id') id: string,
        @Param('barrelId') barrelId: string
    ): Promise<Event> {
        return this.eventsService.addBarrel(id, barrelId);
    }

    @Put(':id/end')
    endEvent(@Param('id') id: string): Promise<Event> {
        return this.eventsService.endEvent(id);
    }

    @Put(':id/activate')
    makeEventActive(@Param('id') id: string): Promise<Event> {
        return this.eventsService.makeEventActive(id);
    }
} 