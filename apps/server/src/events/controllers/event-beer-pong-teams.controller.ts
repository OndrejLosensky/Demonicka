import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { Permission } from '@demonicka/shared';
import { Versions } from '../../versioning/decorators/version.decorator';
import { VersionGuard } from '../../versioning/guards/version.guard';
import { EventBeerPongTeamsService } from '../services/event-beer-pong-teams.service';
import { CreateEventBeerPongTeamDto } from '../dto/create-event-beer-pong-team.dto';

@Controller('events')
@Versions('1')
@UseGuards(JwtAuthGuard, VersionGuard)
export class EventBeerPongTeamsController {
  constructor(
    private readonly eventBeerPongTeamsService: EventBeerPongTeamsService,
  ) {}

  @Get(':eventId/beer-pong-teams')
  @Permissions(Permission.VIEW_DASHBOARD)
  findAll(@Param('eventId', ParseUUIDPipe) eventId: string) {
    return this.eventBeerPongTeamsService.findAll(eventId);
  }

  @Post(':eventId/beer-pong-teams')
  @Permissions(Permission.MANAGE_BEER_PONG_TEAMS)
  create(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() dto: CreateEventBeerPongTeamDto,
  ) {
    return this.eventBeerPongTeamsService.create(eventId, dto);
  }

  @Delete(':eventId/beer-pong-teams/:teamId')
  @Permissions(Permission.MANAGE_BEER_PONG_TEAMS)
  delete(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Param('teamId', ParseUUIDPipe) teamId: string,
  ) {
    return this.eventBeerPongTeamsService.delete(eventId, teamId);
  }
}
