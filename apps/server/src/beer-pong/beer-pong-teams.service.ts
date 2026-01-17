import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BeerPongTeam } from '@prisma/client';
import { CreateTeamDto } from './dto/create-team.dto';
import { EventBeerPongTeamsService } from '../events/services/event-beer-pong-teams.service';

@Injectable()
export class BeerPongTeamsService {
  private readonly logger = new Logger(BeerPongTeamsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBeerPongTeamsService: EventBeerPongTeamsService,
  ) {}

  async create(
    beerPongEventId: string,
    createDto: CreateTeamDto,
  ): Promise<BeerPongTeam> {
    // Verify beer pong event exists and is in DRAFT status
    const beerPongEvent = await this.prisma.beerPongEvent.findFirst({
      where: {
        id: beerPongEventId,
        deletedAt: null,
      },
      include: {
        event: true,
        teams: {
          where: { deletedAt: null },
        },
      },
    });

    if (!beerPongEvent) {
      throw new NotFoundException(
        `Beer pong event with ID ${beerPongEventId} not found`,
      );
    }

    if (beerPongEvent.status !== 'DRAFT') {
      throw new BadRequestException(
        'Teams can only be added when tournament is in DRAFT status',
      );
    }

    // Check if we already have 8 teams
    if (beerPongEvent.teams.length >= 8) {
      throw new BadRequestException(
        'Tournament already has 8 teams. Cannot add more.',
      );
    }

    // Check if team name is unique within this tournament
    const existingInTournament = beerPongEvent.teams.find(
      (t) => t.name.toLowerCase() === createDto.name.toLowerCase(),
    );
    if (existingInTournament) {
      throw new BadRequestException(
        `Team name "${createDto.name}" already exists in this tournament`,
      );
    }

    // Check if either player is already in a team in this tournament
    const playerInTournament = beerPongEvent.teams.find(
      (t) =>
        t.player1Id === createDto.player1Id ||
        t.player2Id === createDto.player1Id ||
        t.player1Id === createDto.player2Id ||
        t.player2Id === createDto.player2Id,
    );
    if (playerInTournament) {
      throw new BadRequestException(
        'One or both players are already in a team in this tournament',
      );
    }

    // Create or get EventBeerPongTeam (event-level pool for reuse across tournaments)
    // First, try to find existing event-level team with same name and players
    let eventTeam = await this.prisma.eventBeerPongTeam.findFirst({
      where: {
        eventId: beerPongEvent.eventId,
        deletedAt: null,
        name: { equals: createDto.name, mode: 'insensitive' },
        player1Id: createDto.player1Id,
        player2Id: createDto.player2Id,
      },
    });

    // If not found, try to create it (will fail if name exists with different players, or players in different team)
    if (!eventTeam) {
      eventTeam = await this.eventBeerPongTeamsService.create(
        beerPongEvent.eventId,
        {
          name: createDto.name,
          player1Id: createDto.player1Id,
          player2Id: createDto.player2Id,
        },
      );
    }

    // TypeScript guard: eventTeam should always exist at this point
    if (!eventTeam) {
      throw new BadRequestException('Failed to create or find event team');
    }

    return this.prisma.beerPongTeam.create({
      data: {
        beerPongEventId,
        eventBeerPongTeamId: eventTeam.id,
        name: createDto.name,
        player1Id: createDto.player1Id,
        player2Id: createDto.player2Id,
      },
      include: {
        player1: true,
        player2: true,
      },
    });
  }

  /**
   * Add an existing EventBeerPongTeam from the event pool to this tournament (reuse).
   */
  async createFromEventTeam(
    beerPongEventId: string,
    eventBeerPongTeamId: string,
  ): Promise<BeerPongTeam> {
    const beerPongEvent = await this.prisma.beerPongEvent.findFirst({
      where: { id: beerPongEventId, deletedAt: null },
      include: {
        event: true,
        teams: { where: { deletedAt: null } },
      },
    });
    if (!beerPongEvent) {
      throw new NotFoundException(
        `Beer pong event with ID ${beerPongEventId} not found`,
      );
    }
    if (beerPongEvent.status !== 'DRAFT') {
      throw new BadRequestException(
        'Teams can only be added when tournament is in DRAFT status',
      );
    }
    if (beerPongEvent.teams.length >= 8) {
      throw new BadRequestException(
        'Tournament already has 8 teams. Cannot add more.',
      );
    }

    const eventTeam = await this.prisma.eventBeerPongTeam.findFirst({
      where: {
        id: eventBeerPongTeamId,
        eventId: beerPongEvent.eventId,
        deletedAt: null,
      },
      include: { player1: true, player2: true },
    });
    if (!eventTeam) {
      throw new NotFoundException(
        `Event team with ID ${eventBeerPongTeamId} not found in this event`,
      );
    }

    const existingName = beerPongEvent.teams.find(
      (t) => t.name.toLowerCase() === eventTeam.name.toLowerCase(),
    );
    if (existingName) {
      throw new BadRequestException(
        `Team name "${eventTeam.name}" already exists in this tournament`,
      );
    }
    const playerInTournament = beerPongEvent.teams.find(
      (t) =>
        t.player1Id === eventTeam.player1Id ||
        t.player2Id === eventTeam.player1Id ||
        t.player1Id === eventTeam.player2Id ||
        t.player2Id === eventTeam.player2Id,
    );
    if (playerInTournament) {
      throw new BadRequestException(
        'One or both players are already in a team in this tournament',
      );
    }

    return this.prisma.beerPongTeam.create({
      data: {
        beerPongEventId,
        eventBeerPongTeamId: eventTeam.id,
        name: eventTeam.name,
        player1Id: eventTeam.player1Id,
        player2Id: eventTeam.player2Id,
      },
      include: { player1: true, player2: true },
    });
  }

  async findAll(beerPongEventId: string): Promise<BeerPongTeam[]> {
    const event = await this.prisma.beerPongEvent.findFirst({
      where: {
        id: beerPongEventId,
        deletedAt: null,
      },
    });

    if (!event) {
      throw new NotFoundException(
        `Beer pong event with ID ${beerPongEventId} not found`,
      );
    }

    return this.prisma.beerPongTeam.findMany({
      where: {
        beerPongEventId,
        deletedAt: null,
      },
      include: {
        player1: true,
        player2: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async delete(beerPongEventId: string, teamId: string): Promise<void> {
    const event = await this.prisma.beerPongEvent.findFirst({
      where: {
        id: beerPongEventId,
        deletedAt: null,
      },
    });

    if (!event) {
      throw new NotFoundException(
        `Beer pong event with ID ${beerPongEventId} not found`,
      );
    }

    if (event.status !== 'DRAFT') {
      throw new BadRequestException(
        'Teams can only be deleted when tournament is in DRAFT status',
      );
    }

    const team = await this.prisma.beerPongTeam.findFirst({
      where: {
        id: teamId,
        beerPongEventId,
        deletedAt: null,
      },
    });

    if (!team) {
      throw new NotFoundException(
        `Team with ID ${teamId} not found in this tournament`,
      );
    }

    await this.prisma.beerPongTeam.update({
      where: { id: teamId },
      data: { deletedAt: new Date() },
    });
  }
}
