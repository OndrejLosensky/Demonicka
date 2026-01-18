import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { Prisma } from '@prisma/client';
 
export type EventDetailEvent = Prisma.EventGetPayload<{
  include: {
    users: { include: { user: true } };
    barrels: { include: { barrel: true } };
  };
}>;
 
export type EventDetailBeerLogRow = Prisma.EventBeerGetPayload<{
  include: { user: true; barrel: true };
}>;
 
export type EventDetailBeerPongTeam = Prisma.EventBeerPongTeamGetPayload<{
  include: { player1: true; player2: true };
}>;
 
export interface EventDetailUserRow
  extends Prisma.UserGetPayload<Record<string, never>> {
  eventBeerCount: number;
}
 
export interface EventDetailData {
  event: EventDetailEvent;
  users: EventDetailUserRow[];
  barrels: Prisma.BarrelGetPayload<Record<string, never>>[];
  beerLog: EventDetailBeerLogRow[];
  beerPongTeams: EventDetailBeerPongTeam[];
  beerPongEvents: Prisma.BeerPongEventGetPayload<Record<string, never>>[];
}
 
@Injectable()
export class EventDetailDataLoader {
  constructor(private readonly prisma: PrismaService) {}
 
  async load(eventId: string): Promise<EventDetailData> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        users: { include: { user: true } },
        barrels: { include: { barrel: true } },
      },
    });
 
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }
 
    const eventUserIds = event.users.map((eu) => eu.userId);
 
    const beerCounts = await this.prisma.eventBeer.groupBy({
      by: ['userId'],
      where: {
        eventId,
        userId: { in: eventUserIds },
        deletedAt: null,
      },
      _count: { id: true },
    });
 
    const beerCountByUserId = new Map(
      beerCounts.map((b) => [b.userId, b._count.id]),
    );
 
    const users: EventDetailUserRow[] = event.users.map((eu) => ({
      ...eu.user,
      eventBeerCount: beerCountByUserId.get(eu.userId) ?? 0,
    }));
 
    const barrels = event.barrels.map((eb) => eb.barrel);
 
    const beerLog = await this.prisma.eventBeer.findMany({
      where: { eventId },
      include: { user: true, barrel: true },
      orderBy: { consumedAt: 'asc' },
    });
 
    const beerPongTeams = await this.prisma.eventBeerPongTeam.findMany({
      where: { eventId },
      include: { player1: true, player2: true },
      orderBy: { name: 'asc' },
    });
 
    const beerPongEvents = await this.prisma.beerPongEvent.findMany({
      where: { eventId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
 
    return {
      event,
      users,
      barrels,
      beerLog,
      beerPongTeams,
      beerPongEvents,
    };
  }
}

