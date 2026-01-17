import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  BeerPongGame,
  BeerPongRound,
  BeerPongGameStatus,
} from '@prisma/client';
import { EventBeersService } from '../events/services/event-beers.service';
import { CreateTeamDto } from './dto/create-team.dto';

@Injectable()
export class BeerPongGamesService {
  private readonly logger = new Logger(BeerPongGamesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBeersService: EventBeersService,
  ) {}

  async initializeBracket(beerPongEventId: string): Promise<BeerPongGame[]> {
    const event = await this.prisma.beerPongEvent.findFirst({
      where: {
        id: beerPongEventId,
        deletedAt: null,
      },
      include: {
        teams: {
          where: { deletedAt: null },
        },
        games: true,
      },
    });

    if (!event) {
      throw new NotFoundException(
        `Beer pong event with ID ${beerPongEventId} not found`,
      );
    }

    if (event.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Bracket can only be initialized when tournament is ACTIVE',
      );
    }

    if (event.games.length > 0) {
      throw new BadRequestException('Bracket has already been initialized');
    }

    if (event.teams.length !== 8) {
      throw new BadRequestException(
        `Bracket requires exactly 8 teams. Currently has ${event.teams.length} teams.`,
      );
    }

    // Randomize team order for bracket
    const shuffledTeams = [...event.teams].sort(() => Math.random() - 0.5);

    // Create 4 quarterfinal games
    const quarterfinals: BeerPongGame[] = [];
    for (let i = 0; i < 4; i++) {
      const team1 = shuffledTeams[i * 2];
      const team2 = shuffledTeams[i * 2 + 1];

      const game = await this.prisma.beerPongGame.create({
        data: {
          beerPongEventId,
          round: 'QUARTERFINAL',
          team1Id: team1.id,
          team2Id: team2.id,
          status: 'PENDING',
        },
      });
      quarterfinals.push(game);
    }

    return quarterfinals;
  }

  async startGame(gameId: string, operatorId: string): Promise<BeerPongGame> {
    const game = await this.prisma.beerPongGame.findUnique({
      where: { id: gameId },
      include: {
        beerPongEvent: {
          include: {
            event: true,
          },
        },
        team1: {
          include: {
            player1: true,
            player2: true,
          },
        },
        team2: {
          include: {
            player1: true,
            player2: true,
          },
        },
      },
    });

    if (!game) {
      throw new NotFoundException(`Game with ID ${gameId} not found`);
    }

    if (game.status !== 'PENDING') {
      throw new BadRequestException(
        `Game is not in PENDING status. Current status: ${game.status}`,
      );
    }

    // Check if game has already been started (database flag check)
    if (game.beersAddedAt) {
      throw new BadRequestException(
        'Game has already been started. Beers were already added.',
      );
    }

    // Check time window if startedAt exists
    if (game.startedAt) {
      const timeWindowMs =
        game.beerPongEvent.timeWindowMinutes * 60 * 1000;
      const timeSinceStart = Date.now() - game.startedAt.getTime();

      if (timeSinceStart > timeWindowMs) {
        throw new BadRequestException(
          `Time window (${game.beerPongEvent.timeWindowMinutes} minutes) has passed since game was initially started`,
        );
      }
    }

    // Use transaction to ensure atomicity
    const result = await this.prisma.$transaction(async (tx) => {
      // Double-check beers weren't added (race condition protection)
      const currentGame = await tx.beerPongGame.findUnique({
        where: { id: gameId },
      });

      if (currentGame?.beersAddedAt) {
        throw new BadRequestException(
          'Game was already started by another operator',
        );
      }

      const beersPerPlayer = game.beerPongEvent.beersPerPlayer;
      const now = new Date();

      // Get active barrel for event beers (optional)
      const activeBarrel = await tx.barrel.findFirst({
        where: { isActive: true, deletedAt: null },
      });

      // Add beers for team1 players
      const team1Beers: any[] = [];
      const players1 = [game.team1.player1Id, game.team1.player2Id];
      for (const playerId of players1) {
        for (let i = 0; i < beersPerPlayer; i++) {
          // Create EventBeer directly in transaction
          const eventBeer = await tx.eventBeer.create({
            data: {
              eventId: game.beerPongEvent.eventId,
              userId: playerId,
              barrelId: activeBarrel?.id || null,
            },
          });

          // Create global Beer record
          const beer = await tx.beer.create({
            data: {
              userId: playerId,
              barrelId: activeBarrel?.id || null,
            },
          });

          // Update user beer count
          const user = await tx.user.findUnique({
            where: { id: playerId },
          });
          if (user) {
            await tx.user.update({
              where: { id: playerId },
              data: {
                beerCount: (user.beerCount || 0) + 1,
                lastBeerTime: now,
              },
            });
          }

          team1Beers.push({
            beerPongGameId: gameId,
            userId: playerId,
            eventBeerId: eventBeer.id,
          });
        }
      }

      // Add beers for team2 players
      const team2Beers: any[] = [];
      const players2 = [game.team2.player1Id, game.team2.player2Id];
      for (const playerId of players2) {
        for (let i = 0; i < beersPerPlayer; i++) {
          // Create EventBeer directly in transaction
          const eventBeer = await tx.eventBeer.create({
            data: {
              eventId: game.beerPongEvent.eventId,
              userId: playerId,
              barrelId: activeBarrel?.id || null,
            },
          });

          // Create global Beer record
          const beer = await tx.beer.create({
            data: {
              userId: playerId,
              barrelId: activeBarrel?.id || null,
            },
          });

          // Update user beer count
          const user = await tx.user.findUnique({
            where: { id: playerId },
          });
          if (user) {
            await tx.user.update({
              where: { id: playerId },
              data: {
                beerCount: (user.beerCount || 0) + 1,
                lastBeerTime: now,
              },
            });
          }

          team2Beers.push({
            beerPongGameId: gameId,
            userId: playerId,
            eventBeerId: eventBeer.id,
          });
        }
      }

      // Create BeerPongGameBeer records
      await tx.beerPongGameBeer.createMany({
        data: [...team1Beers, ...team2Beers],
      });

      // Update game status
      const updatedGame = await tx.beerPongGame.update({
        where: { id: gameId },
        data: {
          status: 'IN_PROGRESS',
          startedAt: now,
          beersAddedAt: now,
          startedBy: operatorId,
        },
      });

      return updatedGame;
    });

    return result;
  }

  async completeGame(
    gameId: string,
    winnerTeamId: string,
  ): Promise<BeerPongGame> {
    const game = await this.prisma.beerPongGame.findUnique({
      where: { id: gameId },
      include: {
        team1: true,
        team2: true,
      },
    });

    if (!game) {
      throw new NotFoundException(`Game with ID ${gameId} not found`);
    }

    if (game.status !== 'IN_PROGRESS') {
      throw new BadRequestException(
        `Game is not in IN_PROGRESS status. Current status: ${game.status}`,
      );
    }

    // Verify winner is one of the teams
    if (winnerTeamId !== game.team1Id && winnerTeamId !== game.team2Id) {
      throw new BadRequestException(
        'Winner team must be one of the teams playing in this game',
      );
    }

    const now = new Date();
    const durationSeconds = game.startedAt
      ? Math.floor((now.getTime() - game.startedAt.getTime()) / 1000)
      : null;

    const updated = await this.prisma.beerPongGame.update({
      where: { id: gameId },
      data: {
        status: 'COMPLETED',
        winnerTeamId,
        endedAt: now,
        durationSeconds,
      },
    });

    // Return with beerPongEventId for convenience
    return {
      ...updated,
      beerPongEventId: game.beerPongEventId,
    } as BeerPongGame & { beerPongEventId: string };
  }

  async advanceWinners(beerPongEventId: string): Promise<BeerPongGame[]> {
    const event = await this.prisma.beerPongEvent.findFirst({
      where: {
        id: beerPongEventId,
        deletedAt: null,
      },
      include: {
        games: {
          include: {
            team1: true,
            team2: true,
            winnerTeam: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException(
        `Beer pong event with ID ${beerPongEventId} not found`,
      );
    }

    const createdGames: BeerPongGame[] = [];

    // Check if all quarterfinal games are completed
    const quarterfinals = event.games.filter(
      (g) => g.round === 'QUARTERFINAL',
    );
    const completedQuarterfinals = quarterfinals.filter(
      (g) => g.status === 'COMPLETED' && g.winnerTeamId,
    );

    // Create semifinals if all quarterfinals are done and semifinals don't exist
    if (
      quarterfinals.length === 4 &&
      completedQuarterfinals.length === 4
    ) {
      const semifinals = event.games.filter((g) => g.round === 'SEMIFINAL');
      if (semifinals.length === 0) {
        const winners = completedQuarterfinals.map((g) => g.winnerTeamId!);

        for (let i = 0; i < 2; i++) {
          const game = await this.prisma.beerPongGame.create({
            data: {
              beerPongEventId,
              round: 'SEMIFINAL',
              team1Id: winners[i * 2],
              team2Id: winners[i * 2 + 1],
              status: 'PENDING',
            },
          });
          createdGames.push(game);
        }
      }
    }

    // Check if all semifinal games are completed
    const semifinals = event.games.filter((g) => g.round === 'SEMIFINAL');
    const completedSemifinals = semifinals.filter(
      (g) => g.status === 'COMPLETED' && g.winnerTeamId,
    );

    // Create final if both semifinals are done and final doesn't exist
    if (semifinals.length === 2 && completedSemifinals.length === 2) {
      const finals = event.games.filter((g) => g.round === 'FINAL');
      if (finals.length === 0) {
        const winners = completedSemifinals.map((g) => g.winnerTeamId!);

        const game = await this.prisma.beerPongGame.create({
          data: {
            beerPongEventId,
            round: 'FINAL',
            team1Id: winners[0],
            team2Id: winners[1],
            status: 'PENDING',
          },
        });
        createdGames.push(game);
      }
    }

    return createdGames;
  }

  async undoGameStart(gameId: string): Promise<void> {
    const game = await this.prisma.beerPongGame.findUnique({
      where: { id: gameId },
      include: {
        beerPongEvent: true,
        gameBeers: {
          include: {
            eventBeer: true,
          },
        },
      },
    });

    if (!game) {
      throw new NotFoundException(`Game with ID ${gameId} not found`);
    }

    if (!game.beersAddedAt) {
      throw new BadRequestException('Game has not been started yet');
    }

    // Check undo window
    const undoWindowMs = game.beerPongEvent.undoWindowMinutes * 60 * 1000;
    const timeSinceBeersAdded = Date.now() - game.beersAddedAt.getTime();

    if (timeSinceBeersAdded > undoWindowMs) {
      throw new BadRequestException(
        `Undo window (${game.beerPongEvent.undoWindowMinutes} minutes) has passed`,
      );
    }

    // Use transaction to undo everything
    await this.prisma.$transaction(async (tx) => {
      // Soft delete all EventBeer records
      for (const gameBeer of game.gameBeers) {
        await tx.eventBeer.update({
          where: { id: gameBeer.eventBeerId },
          data: { deletedAt: new Date() },
        });

        // Decrement user beer count
        const user = await tx.user.findUnique({
          where: { id: gameBeer.userId },
        });
        if (user) {
          await tx.user.update({
            where: { id: gameBeer.userId },
            data: {
              beerCount: Math.max(0, (user.beerCount || 0) - 1),
            },
          });
        }
      }

      // Delete BeerPongGameBeer records
      await tx.beerPongGameBeer.deleteMany({
        where: { beerPongGameId: gameId },
      });

      // Reset game status
      await tx.beerPongGame.update({
        where: { id: gameId },
        data: {
          status: 'PENDING',
          startedAt: null,
          beersAddedAt: null,
          startedBy: null,
        },
      });
    });
  }
}
