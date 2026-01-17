import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BeerPongTeam } from '@prisma/client';
import { CreateTeamDto } from './dto/create-team.dto';

@Injectable()
export class BeerPongTeamsService {
  private readonly logger = new Logger(BeerPongTeamsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    beerPongEventId: string,
    createDto: CreateTeamDto,
  ): Promise<BeerPongTeam> {
    // Verify beer pong event exists and is in DRAFT status
    const event = await this.prisma.beerPongEvent.findFirst({
      where: {
        id: beerPongEventId,
        deletedAt: null,
      },
      include: {
        teams: {
          where: { deletedAt: null },
        },
      },
    });

    if (!event) {
      throw new NotFoundException(
        `Beer pong event with ID ${beerPongEventId} not found`,
      );
    }

    if (event.status !== 'DRAFT') {
      throw new BadRequestException(
        'Teams can only be added when tournament is in DRAFT status',
      );
    }

    // Check if we already have 8 teams
    if (event.teams.length >= 8) {
      throw new BadRequestException(
        'Tournament already has 8 teams. Cannot add more.',
      );
    }

    // Verify both users exist
    const [player1, player2] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: createDto.player1Id } }),
      this.prisma.user.findUnique({ where: { id: createDto.player2Id } }),
    ]);

    if (!player1 || !player2) {
      throw new NotFoundException('One or both players not found');
    }

    // Verify players are different
    if (createDto.player1Id === createDto.player2Id) {
      throw new BadRequestException('Team must have two different players');
    }

    // Check if team name is unique within this tournament
    const existingTeam = event.teams.find(
      (t) => t.name.toLowerCase() === createDto.name.toLowerCase(),
    );
    if (existingTeam) {
      throw new BadRequestException(
        `Team name "${createDto.name}" already exists in this tournament`,
      );
    }

    // Check if either player is already in a team in this tournament
    const playerInTeam = event.teams.find(
      (t) =>
        t.player1Id === createDto.player1Id ||
        t.player2Id === createDto.player1Id ||
        t.player1Id === createDto.player2Id ||
        t.player2Id === createDto.player2Id,
    );
    if (playerInTeam) {
      throw new BadRequestException(
        'One or both players are already in a team in this tournament',
      );
    }

    return this.prisma.beerPongTeam.create({
      data: {
        beerPongEventId,
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
