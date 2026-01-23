import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  ParseUUIDPipe,
  Body,
  Delete,
} from '@nestjs/common';
import { EventBeersService } from '../services/event-beers.service';
import { EventBeer } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Versions } from '../../versioning/decorators/version.decorator';
import { VersionGuard } from '../../versioning/guards/version.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { User } from '@prisma/client';
import { CreateEventBeerDto } from '../dto/create-event-beer.dto';
@Controller('events/:eventId/beers')
@Versions('1')
@UseGuards(JwtAuthGuard, VersionGuard)
export class EventBeersController {
  constructor(private readonly eventBeersService: EventBeersService) {}

  @Post('users/:userId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR, UserRole.USER)
  async createEventBeer(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: CreateEventBeerDto,
    @CurrentUser() user?: User,
  ): Promise<EventBeer> {
    // Ensure volumeLitres is properly parsed as a number
    const volumeLitres = dto.volumeLitres !== undefined 
      ? typeof dto.volumeLitres === 'string' 
        ? parseFloat(dto.volumeLitres) 
        : dto.volumeLitres
      : 0.5;
    
    return this.eventBeersService.create(
      eventId,
      userId,
      dto.barrelId,
      user?.id,
      Boolean(dto.spilled),
      dto.beerSize || 'LARGE',
      volumeLitres,
    );
  }

  @Delete('users/:userId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR, UserRole.USER)
  async removeEventBeer(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() user?: User,
  ): Promise<void> {
    return this.eventBeersService.remove(eventId, userId, user?.id);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR)
  async getEventBeers(
    @Param('eventId', ParseUUIDPipe) eventId: string,
  ): Promise<EventBeer[]> {
    return this.eventBeersService.findByEventId(eventId);
  }

  @Get('users/:userId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR, UserRole.USER)
  async getUserEventBeers(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<EventBeer[]> {
    return this.eventBeersService.findByEventAndUser(eventId, userId);
  }

  @Get('users/:userId/count')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR, UserRole.USER)
  async getUserEventBeerCount(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<number> {
    return this.eventBeersService.getEventBeerCount(eventId, userId);
  }
}
