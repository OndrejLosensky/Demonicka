import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { Event } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { Barrel } from '../barrels/entities/barrel.entity';
import { Versions } from '../versioning/decorators/version.decorator';
import { VersionGuard } from '../versioning/guards/version.guard';
import { Public } from '../auth/decorators/public.decorator';

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
  @Public()
  findAll(): Promise<Event[]> {
    return this.eventsService.findAll();
  }

  @Get('active')
  @Public()
  getActiveEvent(): Promise<Event | null> {
    return this.eventsService.getActiveEvent();
  }

  @Get(':id')
  @Public()
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Event> {
    return this.eventsService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEventDto: UpdateEventDto,
  ): Promise<Event> {
    return this.eventsService.update(id, updateEventDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.eventsService.remove(id);
  }

  @Put(':id/activate')
  setActive(@Param('id', ParseUUIDPipe) id: string): Promise<Event> {
    return this.eventsService.setActive(id);
  }

  @Put(':id/end')
  endEvent(@Param('id', ParseUUIDPipe) id: string): Promise<Event> {
    return this.eventsService.endEvent(id);
  }

  @Get(':id/users')
  @Public()
  getEventUsers(@Param('id', ParseUUIDPipe) id: string): Promise<User[]> {
    return this.eventsService.getEventUsers(id);
  }

  @Put(':id/users/:userId')
  addUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<Event> {
    return this.eventsService.addUser(id, userId);
  }

  @Delete(':id/users/:userId')
  removeUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<Event> {
    return this.eventsService.removeUser(id, userId);
  }

  @Get(':id/barrels')
  @Public()
  getEventBarrels(@Param('id', ParseUUIDPipe) id: string): Promise<Barrel[]> {
    return this.eventsService.getEventBarrels(id);
  }

  @Put(':id/barrels/:barrelId')
  addBarrel(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('barrelId', ParseUUIDPipe) barrelId: string,
  ): Promise<Event> {
    return this.eventsService.addBarrel(id, barrelId);
  }

  @Delete(':id/barrels/:barrelId')
  removeBarrel(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('barrelId', ParseUUIDPipe) barrelId: string,
  ): Promise<Event> {
    return this.eventsService.removeBarrel(id, barrelId);
  }
} 