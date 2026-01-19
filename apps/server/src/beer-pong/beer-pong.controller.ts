import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { BeerPongService } from './beer-pong.service';
import { BeerPongTeamsService } from './beer-pong-teams.service';
import { BeerPongGamesService } from './beer-pong-games.service';
import { CreateBeerPongEventDto } from './dto/create-beer-pong-event.dto';
import { UpdateBeerPongEventDto } from './dto/update-beer-pong-event.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { AddTeamFromEventDto } from './dto/add-team-from-event.dto';
import { CompleteGameDto } from './dto/complete-game.dto';
import { AssignTeamDto } from './dto/assign-team.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '@demonicka/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@Controller('beer-pong')
@UseGuards(JwtAuthGuard)
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
    const event = await this.beerPongService.create(createDto, user.id);
    // Initialize empty bracket structure
    try {
      await this.gamesService.initializeEmptyBracket(event.id);
    } catch (error: any) {
      // If bracket already exists, that's fine - just continue
      if (!error.message?.includes('already been initialized')) {
        throw error;
      }
    }
    // Return event with games included
    return this.beerPongService.findOne(event.id);
  }

  @Get()
  @Permissions(Permission.VIEW_DASHBOARD)
  async findAll(@Query('eventId') eventId?: string) {
    return this.beerPongService.findAll(eventId);
  }

  @Get(':id')
  @Permissions(Permission.VIEW_DASHBOARD)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    // DB check first – count games for this event (visible in server logs)
    const dbCount = await this.gamesService.countGamesByEventId(id);
    console.error('[BeerPong findOne] *** HANDLER HIT *** id=' + id + ' DB_games_count=' + dbCount);

    let event = await this.beerPongService.findOne(id);
    const gamesLength = event?.games?.length ?? 0;
    console.log('[BeerPong findOne] got event, games.length=', gamesLength);

    // If bracket doesn't exist yet (for old tournaments or new ones), initialize it
    // Check both DB count and games array length for safety
    const shouldInitialize = dbCount === 0 || gamesLength === 0;
    if (shouldInitialize) {
      console.log('[BeerPong findOne] no games (dbCount=' + dbCount + ', gamesLength=' + gamesLength + '), calling initializeEmptyBracket');
      try {
        await this.gamesService.initializeEmptyBracket(id);
        console.log('[BeerPong findOne] bracket initialized, reloading event');
        event = await this.beerPongService.findOne(id);
        const reloadGamesLength = event?.games?.length ?? 0;
        console.log('[BeerPong findOne] after reload, games.length=', reloadGamesLength);
      } catch (error: any) {
        const errInfo = { message: error?.message, code: error?.code, meta: error?.meta };
        console.error('[BeerPong findOne] *** CATCH ***', JSON.stringify(errInfo));
        // If bracket already exists, reload and return
        if (error.message?.includes('already been initialized')) {
          console.log('[BeerPong findOne] bracket already initialized, reloading event');
          event = await this.beerPongService.findOne(id);
        } else {
          console.error('[BeerPong findOne] Failed to initialize bracket. Rethrowing so client gets 500.');
          throw error; // Rethrow so frontend gets 500 and we see the real error
        }
      }
    }

    console.log('[BeerPong findOne] returning, games.length=', event?.games?.length ?? 'n/a');
    return event;
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
  async startTournament(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    const updated = await this.beerPongService.startTournament(id, user.id);
    // Initialize bracket after starting (assigns teams if bracket is empty)
    try {
      await this.gamesService.initializeBracket(id);
    } catch (error: any) {
      // If bracket already has teams assigned, that's fine
      if (!error.message?.includes('already been initialized')) {
        throw error;
      }
    }
    return this.beerPongService.findOne(id);
  }

  @Post(':id/complete')
  @Permissions(Permission.UPDATE_BEER_PONG_EVENT)
  async completeTournament(@Param('id', ParseUUIDPipe) id: string) {
    return this.beerPongService.completeTournament(id);
  }

  // Team management endpoints
  @Post(':id/teams/from-event')
  @Permissions(Permission.MANAGE_BEER_PONG_TEAMS)
  async addTeamFromEvent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddTeamFromEventDto,
    @CurrentUser() user: User,
  ) {
    return this.teamsService.createFromEventTeam(id, dto.eventBeerPongTeamId, user.id);
  }

  @Post(':id/teams')
  @Permissions(Permission.MANAGE_BEER_PONG_TEAMS)
  async createTeam(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createDto: CreateTeamDto,
    @CurrentUser() user: User,
  ) {
    return this.teamsService.create(id, createDto, user.id);
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

  @Put('games/:gameId/assign-team')
  @Permissions(Permission.MANAGE_BEER_PONG_TEAMS)
  async assignTeamToPosition(
    @Param('gameId', ParseUUIDPipe) gameId: string,
    @Body() assignDto: AssignTeamDto,
  ) {
    return this.gamesService.assignTeamToPosition(
      gameId,
      assignDto.teamId,
      assignDto.position,
    );
  }
}
