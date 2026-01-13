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
  Query,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { Event, Barrel, EventBeer, User } from '@prisma/client';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Versions } from '../versioning/decorators/version.decorator';
import { VersionGuard } from '../versioning/guards/version.guard';
import { EventBeersService } from './services/event-beers.service';
import { BypassAuth } from 'src/auth/decorators/bypass-auth.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '@demonicka/shared';

@Controller('events')
@BypassAuth()
@Versions('1')
@UseGuards(JwtAuthGuard, VersionGuard)
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly eventBeersService: EventBeersService,
  ) {}

  @Get()
  findAll(@CurrentUser() user?: User): Promise<Event[]> {
    return this.eventsService.findAll(user);
  }

  @Get('active')
  @Public()
  getActiveEvent(): Promise<Event | null> {
    return this.eventsService.getActiveEvent();
  }

  @Post()
  @Permissions(Permission.CREATE_EVENT)
  create(@Body() createEventDto: CreateEventDto, @CurrentUser() user: User): Promise<Event> {
    return this.eventsService.create(createEventDto, user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user?: User): Promise<Event> {
    return this.eventsService.findOne(id, user);
  }

  @Put(':id')
  @Permissions(Permission.UPDATE_EVENT)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEventDto: UpdateEventDto,
    @CurrentUser() user: User,
  ): Promise<Event> {
    return this.eventsService.update(id, updateEventDto, user);
  }

  @Delete(':id')
  @Permissions(Permission.DELETE_EVENT)
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User): Promise<void> {
    return this.eventsService.remove(id, user);
  }

  @Post('cleanup')
  cleanup(): Promise<void> {
    return this.eventsService.cleanup();
  }

  @Put(':id/users/:userId')
  @BypassAuth()
  addUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<Event> {
    return this.eventsService.addUser(id, userId);
  }

  @Put(':id/active')
  @BypassAuth()
  setActive(@Param('id', ParseUUIDPipe) id: string): Promise<Event> {
    return this.eventsService.setActive(id);
  }

  @Delete(':id/active')
  deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<Event> {
    return this.eventsService.deactivate(id);
  }

  @Put(':id/end')
  endEvent(@Param('id', ParseUUIDPipe) id: string): Promise<Event> {
    return this.eventsService.endEvent(id);
  }

  @Delete(':id/users/:userId')
  removeUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<Event> {
    return this.eventsService.removeUser(id, userId);
  }

  @Delete(':id/beers')
  removeAllEventBeers(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.eventBeersService.removeAllForEvent(id);
  }

  @Get(':id/beers')
  getEventBeers(@Param('id', ParseUUIDPipe) id: string): Promise<EventBeer[]> {
    return this.eventBeersService.findAllForEvent(id);
  }

  @Get(':id/users')
  @BypassAuth()
  getEventUsers(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('withDeleted') withDeleted?: boolean,
  ): Promise<User[]> {
    return this.eventsService.getEventUsers(id, withDeleted);
  }

  @Get(':id/barrels')
  @BypassAuth()
  getEventBarrels(@Param('id', ParseUUIDPipe) id: string): Promise<Barrel[]> {
    return this.eventsService.getEventBarrels(id);
  }

  @Put(':id/barrels/:barrelId')
  @BypassAuth()
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

  @Post(':id/users/:userId/beers')
  @BypassAuth()
  addEventBeer(
    @Param('id', ParseUUIDPipe) eventId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    return this.eventsService.addBeer(eventId, userId);
  }

  @Delete(':id/users/:userId/beers')
  @BypassAuth()
  removeEventBeer(
    @Param('id', ParseUUIDPipe) eventId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    return this.eventBeersService.remove(eventId, userId);
  }

  @Get(':id/users/:userId/beers')
  @BypassAuth()
  getEventUserBeers(
    @Param('id', ParseUUIDPipe) eventId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<EventBeer[]> {
    return this.eventBeersService.findByEventAndUser(eventId, userId);
  }

  @Get(':id/users/:userId/beers/count')
  @BypassAuth()
  getEventUserBeerCount(
    @Param('id', ParseUUIDPipe) eventId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<number> {
    return this.eventBeersService.getEventBeerCount(eventId, userId);
  }
}
