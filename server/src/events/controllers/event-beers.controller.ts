import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  ParseUUIDPipe,
  Body,
} from '@nestjs/common';
import { EventBeersService } from '../services/event-beers.service';
import { EventBeer } from '../entities/event-beer.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Versions } from '../../versioning/decorators/version.decorator';
import { VersionGuard } from '../../versioning/guards/version.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';

@Controller('events/:eventId/beers')
@Versions('1')
@UseGuards(JwtAuthGuard, VersionGuard)
export class EventBeersController {
  constructor(private readonly eventBeersService: EventBeersService) {}

  @Post('users/:userId')
  @Roles(UserRole.ADMIN, UserRole.USER)
  async createEventBeer(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body('barrelId') barrelId?: string,
  ): Promise<EventBeer> {
    return this.eventBeersService.create(eventId, userId, barrelId);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async getEventBeers(
    @Param('eventId', ParseUUIDPipe) eventId: string,
  ): Promise<EventBeer[]> {
    return this.eventBeersService.findByEventId(eventId);
  }

  @Get('users/:userId')
  @Roles(UserRole.ADMIN, UserRole.USER)
  async getUserEventBeers(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<EventBeer[]> {
    return this.eventBeersService.findByEventAndUser(eventId, userId);
  }

  @Get('users/:userId/count')
  @Roles(UserRole.ADMIN, UserRole.USER)
  async getUserEventBeerCount(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<number> {
    return this.eventBeersService.getEventBeerCount(eventId, userId);
  }
} 