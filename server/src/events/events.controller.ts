import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { Event } from './entities/event.entity';

@Controller('events')
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

    @Get(':id')
    findOne(@Param('id') id: string): Promise<Event> {
        return this.eventsService.findOne(id);
    }

    @Put(':id/participants/:userId')
    addParticipant(
        @Param('id') id: string,
        @Param('userId') userId: string
    ): Promise<Event> {
        return this.eventsService.addParticipant(id, userId);
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
} 