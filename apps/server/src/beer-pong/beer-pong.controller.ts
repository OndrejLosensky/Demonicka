import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { BeerPongService } from './beer-pong.service';
import { BeerPongTeamsService } from './beer-pong-teams.service';
import { BeerPongGamesService } from './beer-pong-games.service';
import { CreateBeerPongEventDto } from './dto/create-beer-pong-event.dto';
import { UpdateBeerPongEventDto } from './dto/update-beer-pong-event.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { CompleteGameDto } from './dto/complete-game.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '@demonicka/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { Versions } from '../versioning/decorators/version.decorator';
import { VersionGuard } from '../versioning/guards/version.guard';

@Controller('beer-pong')
@Versions('1')
@UseGuards(JwtAuthGuard, VersionGuard, PermissionsGuard)
export class BeerPongController {
  constructor(
    private readonly beerPongService: BeerPongService,
    private readonly teamsService: BeerPongTeamsService,
    private readonly gamesService: BeerPongGamesService,
  ) {}

  @Post()
  @Permissions(Permission.CREATE_BEER_PONG_EVENT)
  async create(
    @Body() createDto: CreateBeerPongEventDto,
    @CurrentUser() user: User,
  ) {
    return this.beerPongService.create(createDto, user.id);
  }

  @Get('event/:eventId')
  @Permissions(Permission.VIEW_DASHBOARD)
  async findAll(@Param('eventId', ParseUUIDPipe) eventId: string) {
    return this.beerPongService.findAll(eventId);
  }

  @Get(':id')
  @Permissions(Permission.VIEW_DASHBOARD)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.beerPongService.findOne(id);
  }

  @Put(':id')
  @Permissions(Permission.UPDATE_BEER_PONG_EVENT)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateBeerPongEventDto,
  ) {
    return this.beerPongService.update(id, updateDto);
  }

  @Delete(':id')
  @Permissions(Permission.DELETE_BEER_PONG_EVENT)
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.beerPongService.delete(id);
    return { message: 'Beer pong event deleted successfully' };
  }

  @Post(':id/start')
  @Permissions(Permission.UPDATE_BEER_PONG_EVENT)
  async startTournament(@Param('id', ParseUUIDPipe) id: string) {
    const updated = await this.beerPongService.startTournament(id);
    // Initialize bracket after starting
    await this.gamesService.initializeBracket(id);
    return updated;
  }

  // Team management endpoints
  @Post(':id/teams')
  @Permissions(Permission.MANAGE_BEER_PONG_TEAMS)
  async createTeam(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createDto: CreateTeamDto,
  ) {
    return this.teamsService.create(id, createDto);
  }

  @Get(':id/teams')
  @Permissions(Permission.VIEW_DASHBOARD)
  async getTeams(@Param('id', ParseUUIDPipe) id: string) {
    return this.teamsService.findAll(id);
  }

  @Delete(':id/teams/:teamId')
  @Permissions(Permission.MANAGE_BEER_PONG_TEAMS)
  async deleteTeam(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('teamId', ParseUUIDPipe) teamId: string,
  ) {
    await this.teamsService.delete(id, teamId);
    return { message: 'Team deleted successfully' };
  }

  // Game management endpoints
  @Post('games/:gameId/start')
  @Permissions(Permission.START_BEER_PONG_GAME)
  async startGame(
    @Param('gameId', ParseUUIDPipe) gameId: string,
    @CurrentUser() user: User,
  ) {
    return this.gamesService.startGame(gameId, user.id);
  }

  @Post('games/:gameId/complete')
  @Permissions(Permission.MANAGE_BEER_PONG_GAME)
  async completeGame(
    @Param('gameId', ParseUUIDPipe) gameId: string,
    @Body() completeDto: CompleteGameDto,
  ) {
    const result = await this.gamesService.completeGame(
      gameId,
      completeDto.winnerTeamId,
    );

    // Try to advance winners after completing game
    try {
      await this.gamesService.advanceWinners(result.beerPongEventId);
    } catch (error) {
      // Log but don't fail the complete operation
      // Error will be handled by gamesService.advanceWinners
    }

    // Return only the game, not the extended type
    const { beerPongEventId, ...game } = result;
    return game;
  }

  @Post('games/:gameId/undo')
  @Permissions(Permission.MANAGE_BEER_PONG_GAME)
  async undoGameStart(@Param('gameId', ParseUUIDPipe) gameId: string) {
    await this.gamesService.undoGameStart(gameId);
    return { message: 'Game start undone successfully' };
  }

  @Post(':id/advance')
  @Permissions(Permission.MANAGE_BEER_PONG_GAME)
  async advanceWinners(@Param('id', ParseUUIDPipe) id: string) {
    return this.gamesService.advanceWinners(id);
  }
}
