import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBeerPongTeam } from '@prisma/client';
import { CreateEventBeerPongTeamDto } from '../dto/create-event-beer-pong-team.dto';

@Injectable()
export class EventBeerPongTeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    eventId: string,
    dto: CreateEventBeerPongTeamDto,
  ): Promise<EventBeerPongTeam> {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
    });
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    const [player1, player2] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: dto.player1Id } }),
      this.prisma.user.findUnique({ where: { id: dto.player2Id } }),
    ]);
    if (!player1 || !player2) {
      throw new NotFoundException('One or both players not found');
    }
    if (dto.player1Id === dto.player2Id) {
      throw new BadRequestException('Team must have two different players');
    }

    const existing = await this.prisma.eventBeerPongTeam.findFirst({
      where: {
        eventId,
        deletedAt: null,
        name: { equals: dto.name, mode: 'insensitive' },
      },
    });
    if (existing) {
      throw new BadRequestException(
        `Team name "${dto.name}" already exists for this event`,
      );
    }

    const playerInTeam = await this.prisma.eventBeerPongTeam.findFirst({
      where: {
        eventId,
        deletedAt: null,
        OR: [
          { player1Id: dto.player1Id },
          { player2Id: dto.player1Id },
          { player1Id: dto.player2Id },
          { player2Id: dto.player2Id },
        ],
      },
    });
    if (playerInTeam) {
      throw new BadRequestException(
        'One or both players are already in a team in this event',
      );
    }

    return this.prisma.eventBeerPongTeam.create({
      data: {
        eventId,
        name: dto.name,
        player1Id: dto.player1Id,
        player2Id: dto.player2Id,
      },
      include: {
        player1: true,
        player2: true,
      },
    });
  }

  async findAll(eventId: string): Promise<EventBeerPongTeam[]> {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
    });
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    return this.prisma.eventBeerPongTeam.findMany({
      where: { eventId, deletedAt: null },
      include: {
        player1: true,
        player2: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async delete(eventId: string, teamId: string): Promise<void> {
    const team = await this.prisma.eventBeerPongTeam.findFirst({
      where: { id: teamId, eventId, deletedAt: null },
    });
    if (!team) {
      throw new NotFoundException(
        `Event beer pong team with ID ${teamId} not found in this event`,
      );
    }

    await this.prisma.eventBeerPongTeam.update({
      where: { id: teamId },
      data: { deletedAt: new Date() },
    });
  }
}
