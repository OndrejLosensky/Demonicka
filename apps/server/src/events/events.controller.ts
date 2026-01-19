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
  StreamableFile,
  DefaultValuePipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { Barrel, EventBeer, User } from '@prisma/client';
import type { Event } from '@demonicka/shared-types';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Versions } from '../versioning/decorators/version.decorator';
import { VersionGuard } from '../versioning/guards/version.guard';
import { EventBeersService } from './services/event-beers.service';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '@demonicka/shared';
import { BeerPongService } from '../beer-pong/beer-pong.service';
import { EventDetailExportBuilder } from '../exports/event-detail/EventDetailExportBuilder';
import { LoggingService } from '../logging/logging.service';

@Controller('events')
@Versions('1')
@UseGuards(JwtAuthGuard, VersionGuard)
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly eventBeersService: EventBeersService,
    private readonly beerPongService: BeerPongService,
    private readonly eventDetailExportBuilder: EventDetailExportBuilder,
    private readonly loggingService: LoggingService,
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
  create(
    @Body() createEventDto: CreateEventDto,
    @CurrentUser() user: User,
  ): Promise<Event> {
    return this.eventsService.create(createEventDto, user.id);
  }

  @Post('cleanup')
  cleanup(@CurrentUser() user: User): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    this.loggingService.logSystemOperationTriggered('EVENTS_CLEANUP', user?.id);
    return this.eventsService.cleanup();
  }

  // CRITICAL: beer-pong route MUST be before all other :id routes
  @Get(':id/beer-pong')
  getEventBeerPongTournaments(@Param('id', ParseUUIDPipe) id: string) {
    return this.beerPongService.findAll(id);
  }

  // Specific routes must come before the generic :id route
  @Get(':id/users/:userId/beers/count')
  getEventUserBeerCount(
    @Param('id', ParseUUIDPipe) eventId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<number> {
    return this.eventBeersService.getEventBeerCount(eventId, userId);
  }

  @Get(':id/users/:userId/beers')
  getEventUserBeers(
    @Param('id', ParseUUIDPipe) eventId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<EventBeer[]> {
    return this.eventBeersService.findByEventAndUser(eventId, userId);
  }

  @Post(':id/users/:userId/beers')
  addEventBeer(
    @Param('id', ParseUUIDPipe) eventId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.eventsService.addBeer(eventId, userId, user.id);
  }

  @Delete(':id/users/:userId/beers')
  removeEventBeer(
    @Param('id', ParseUUIDPipe) eventId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.eventBeersService.remove(eventId, userId, user.id);
  }

  @Put(':id/users/:userId')
  addUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() user: User,
  ): Promise<Event> {
    return this.eventsService.addUser(id, userId, user.id);
  }

  @Delete(':id/users/:userId')
  removeUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<Event> {
    return this.eventsService.removeUser(id, userId);
  }

  @Get(':id/users')
  getEventUsers(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('withDeleted', new DefaultValuePipe(false), ParseBoolPipe)
    withDeleted: boolean,
  ): Promise<User[]> {
    return this.eventsService.getEventUsers(id, withDeleted);
  }

  @Put(':id/barrels/:barrelId')
  addBarrel(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('barrelId', ParseUUIDPipe) barrelId: string,
    @CurrentUser() user: User,
  ): Promise<Event> {
    return this.eventsService.addBarrel(id, barrelId, user.id);
  }

  @Delete(':id/barrels/:barrelId')
  removeBarrel(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('barrelId', ParseUUIDPipe) barrelId: string,
  ): Promise<Event> {
    return this.eventsService.removeBarrel(id, barrelId);
  }

  @Get(':id/barrels')
  getEventBarrels(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('withDeleted', new DefaultValuePipe(false), ParseBoolPipe)
    withDeleted: boolean,
  ): Promise<Barrel[]> {
    return this.eventsService.getEventBarrels(id, withDeleted);
  }

  @Get(':id/beers')
  getEventBeers(@Param('id', ParseUUIDPipe) id: string): Promise<EventBeer[]> {
    return this.eventBeersService.findAllForEvent(id);
  }

  @Delete(':id/beers')
  removeAllEventBeers(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.eventBeersService.removeAllForEvent(id);
  }

  @Put(':id/active')
  setActive(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<Event> {
    return this.eventsService.setActive(id, user.id);
  }

  @Delete(':id/active')
  deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<Event> {
    return this.eventsService.deactivate(id);
  }

  @Put(':id/end')
  endEvent(@Param('id', ParseUUIDPipe) id: string): Promise<Event> {
    return this.eventsService.endEvent(id);
  }

  @Get(':id/export/excel/detail')
  @Permissions(Permission.VIEW_BEERS, Permission.VIEW_LEADERBOARD)
  async exportEventDetailExcel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<StreamableFile> {
    // Access check
    await this.eventsService.findOne(id, user);
    return this.eventDetailExportBuilder.build(id);
  }

  // Generic :id routes must come after all specific routes
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user?: User,
  ): Promise<Event> {
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
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.eventsService.remove(id, user);
  }
}
