import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  BeerPongEvent,
  BeerPongEventStatus,
  Prisma,
} from '@prisma/client';
import { CreateBeerPongEventDto } from './dto/create-beer-pong-event.dto';
import { UpdateBeerPongEventDto } from './dto/update-beer-pong-event.dto';

type BeerPongEventWithRelations = Prisma.BeerPongEventGetPayload<{
  include: {
    event: true;
    teams: {
      include: {
        player1: true;
        player2: true;
      };
    };
    games: {
      include: {
        team1: true;
        team2: true;
        winnerTeam: true;
        gameBeers: {
          include: {
            user: true;
            eventBeer: true;
          };
        };
      };
    };
    creator: true;
  };
}>;

@Injectable()
export class BeerPongService {
  private readonly logger = new Logger(BeerPongService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    createDto: CreateBeerPongEventDto,
    userId: string,
  ): Promise<BeerPongEvent> {
    // Verify event exists
    const event = await this.prisma.event.findUnique({
      where: { id: createDto.eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${createDto.eventId} not found`);
    }

    // Check if event is deleted
    if (event.deletedAt) {
      throw new BadRequestException('Cannot create beer pong event for deleted event');
    }

    return this.prisma.beerPongEvent.create({
      data: {
        eventId: createDto.eventId,
        name: createDto.name,
        description: createDto.description,
        beersPerPlayer: createDto.beersPerPlayer ?? 2,
        timeWindowMinutes: createDto.timeWindowMinutes ?? 5,
        undoWindowMinutes: createDto.undoWindowMinutes ?? 5,
        cancellationPolicy: createDto.cancellationPolicy ?? 'KEEP_BEERS',
        status: 'DRAFT',
        createdBy: userId,
      },
    });
  }

  async findAll(eventId?: string): Promise<BeerPongEvent[]> {
    const where: any = { deletedAt: null };

    if (eventId) {
      where.eventId = eventId;
    }

    return this.prisma.beerPongEvent.findMany({
      where,
      include: {
        event: true,
        teams: {
          where: { deletedAt: null },
          include: {
            player1: true,
            player2: true,
          },
        },
        games: {
          include: {
            team1: true,
            team2: true,
            winnerTeam: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<BeerPongEventWithRelations> {
    const beerPongEvent = await this.prisma.beerPongEvent.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        event: true,
        teams: {
          where: { deletedAt: null },
          include: {
            player1: true,
            player2: true,
          },
        },
        games: {
          include: {
            team1: true,
            team2: true,
            winnerTeam: true,
            gameBeers: {
              include: {
                user: true,
                eventBeer: true,
              },
            },
          },
          orderBy: [{ round: 'asc' }, { createdAt: 'asc' }],
        },
        creator: true,
      },
    });

    if (!beerPongEvent) {
      throw new NotFoundException(`Beer pong event with ID ${id} not found`);
    }

    return beerPongEvent;
  }

  async update(
    id: string,
    updateDto: UpdateBeerPongEventDto,
  ): Promise<BeerPongEvent> {
    const existing = await this.findOne(id);

    // Cannot update if tournament has started
    if (existing.status !== 'DRAFT') {
      throw new BadRequestException(
        'Cannot update beer pong event that has been started',
      );
    }

    return this.prisma.beerPongEvent.update({
      where: { id },
      data: updateDto,
    });
  }

  async delete(id: string): Promise<void> {
    const existing = await this.findOne(id);

    // Cannot delete if tournament is active or completed
    if (existing.status === 'ACTIVE') {
      throw new BadRequestException(
        'Cannot delete beer pong event that is currently active',
      );
    }

    await this.prisma.beerPongEvent.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async startTournament(id: string): Promise<BeerPongEvent> {
    const event = await this.findOne(id);

    if (event.status !== 'DRAFT') {
      throw new BadRequestException(
        'Tournament can only be started when in DRAFT status',
      );
    }

    // Check if we have exactly 8 teams
    const teamCount = event.teams.length;
    if (teamCount !== 8) {
      throw new BadRequestException(
        `Tournament requires exactly 8 teams. Currently has ${teamCount} teams.`,
      );
    }

    // Update status to ACTIVE
    const updated = await this.prisma.beerPongEvent.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        startedAt: new Date(),
      },
    });

    // Initialize bracket (create quarterfinal games)
    // This will be done by BeerPongGamesService.initializeBracket()
    // We'll call it from the controller

    return updated;
  }

  async completeTournament(id: string): Promise<BeerPongEvent> {
    const event = await this.findOne(id);

    if (event.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Tournament can only be completed when in ACTIVE status',
      );
    }

    // Check if final game is completed
    const finalGames = event.games.filter((g) => g.round === 'FINAL');
    if (finalGames.length === 0 || !finalGames[0].winnerTeamId) {
      throw new BadRequestException(
        'Tournament cannot be completed until the final game has a winner',
      );
    }

    return this.prisma.beerPongEvent.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
  }
}
