import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  UserStatsDto,
  TimeDistributionDto,
  DailyStatsDto,
  EventStatsDto,
} from './dto/user-stats.dto';
import {
  subHours,
  subDays,
  startOfToday,
  startOfWeek,
  startOfMonth,
  differenceInHours,
  format,
} from 'date-fns';

@Injectable()
export class UserStatsService {
  constructor(private prisma: PrismaService) {}

  async getUserStats(userId: string): Promise<UserStatsDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        beers: { where: { deletedAt: null } },
        events: { include: { event: true } },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const now = new Date();
    const beers = user.beers || [];
    const events = user.events.map((eu) => eu.event) || [];

    // Calculate beer counts for different time periods
    const beersLastHour = beers.filter(
      (b) => b.createdAt >= subHours(now, 1),
    ).length;

    const beersToday = beers.filter(
      (b) => b.createdAt >= startOfToday(),
    ).length;

    const beersThisWeek = beers.filter(
      (b) => b.createdAt >= startOfWeek(now),
    ).length;

    const beersThisMonth = beers.filter(
      (b) => b.createdAt >= startOfMonth(now),
    ).length;

    // Calculate time-based stats
    const sortedBeers = [...beers].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );

    const firstBeerDate =
      sortedBeers.length > 0 ? sortedBeers[0].createdAt : null;
    const lastBeerDate =
      sortedBeers.length > 0
        ? sortedBeers[sortedBeers.length - 1].createdAt
        : null;

    // Calculate longest break between beers
    let longestBreak = 0;
    if (sortedBeers.length > 1) {
      for (let i = 1; i < sortedBeers.length; i++) {
        const break_hours = differenceInHours(
          sortedBeers[i].createdAt,
          sortedBeers[i - 1].createdAt,
        );
        if (break_hours > longestBreak) {
          longestBreak = break_hours;
        }
      }
    }

    // Calculate daily stats
    const dailyStats: { [key: string]: number } = {};
    let mostBeersInDay = 0;

    beers.forEach((beer) => {
      const date = format(beer.createdAt, 'yyyy-MM-dd');
      dailyStats[date] = (dailyStats[date] || 0) + 1;
      if (dailyStats[date] > mostBeersInDay) {
        mostBeersInDay = dailyStats[date];
      }
    });

    // Calculate hourly distribution
    const hourlyDistribution: { [key: number]: number } = {};
    beers.forEach((beer) => {
      const hour = beer.createdAt.getHours();
      hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
    });

    // Calculate event stats
    const eventStats: EventStatsDto[] = await Promise.all(
      events.map(async (event) => {
        const eventBeers = await this.prisma.eventBeer.findMany({
          where: {
            eventId: event.id,
            userId,
            deletedAt: null,
          },
        });

        const eventUserCount = await this.prisma.eventUsers.count({
          where: { eventId: event.id },
        });

        // Get ranking
        const allEventBeers = await this.prisma.eventBeer.groupBy({
          by: ['userId'],
          where: {
            eventId: event.id,
            deletedAt: null,
          },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
        });

        const rank =
          allEventBeers.findIndex((eb) => eb.userId === userId) + 1 ||
          eventUserCount;

        return {
          eventId: event.id,
          eventName: event.name,
          beerCount: eventBeers.length,
          rank,
          totalParticipants: eventUserCount,
        };
      }),
    );

    // Calculate averages
    const daysSinceFirstBeer = firstBeerDate
      ? differenceInHours(now, firstBeerDate) / 24
      : 0;

    const averageBeersPerDay =
      daysSinceFirstBeer > 0 ? beers.length / daysSinceFirstBeer : 0;

    const averageBeersPerEvent =
      events.length > 0
        ? eventStats.reduce((acc, curr) => acc + curr.beerCount, 0) /
          events.length
        : 0;

    // Calculate global ranking
    const allUsers = await this.prisma.user.findMany({
      where: { deletedAt: null },
      select: { id: true, beerCount: true },
      orderBy: { beerCount: 'desc' },
    });

    const globalRank = allUsers.findIndex((u) => u.id === userId) + 1;
    const totalUsers = allUsers.length;
    const percentile = (globalRank / totalUsers) * 100;

    const stats: UserStatsDto = {
      // Basic Info
      userId: user.id,
      username: user.username || '',
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,

      // Overall Stats
      totalBeers: beers.length,
      averageBeersPerDay,
      averageBeersPerEvent,
      beersLastHour,
      beersToday,
      beersThisWeek,
      beersThisMonth,

      // Time-based Stats
      firstBeerDate,
      lastBeerDate,
      longestBreak,
      mostBeersInDay,

      // Distribution
      hourlyDistribution: Object.entries(hourlyDistribution).map(
        ([hour, count]) => ({
          hour: parseInt(hour),
          count,
        }),
      ),
      dailyStats: Object.entries(dailyStats).map(([date, count]) => ({
        date,
        count,
      })),

      // Event Stats
      eventStats,

      // Rankings
      globalRank,
      totalUsers,
      percentile,
    };

    return stats;
  }

  private async getEventStats(userId: string): Promise<EventStatsDto[]> {
    const events = await this.prisma.event.findMany({
      where: { deletedAt: null },
      include: {
        users: true,
        barrels: true,
      },
    });

    const eventStats: EventStatsDto[] = [];

    for (const event of events) {
      // Check if user participated in this event
      const userInEvent = await this.prisma.eventUsers.findUnique({
        where: {
          eventId_userId: { eventId: event.id, userId },
        },
      });

      if (!userInEvent) {
        continue;
      }

      // Get beers for this event using event_beers table
      const eventBeers = await this.prisma.eventBeer.findMany({
        where: {
          eventId: event.id,
          userId,
          deletedAt: null,
        },
      });

      // Get all users' beers for this event to calculate ranking
      const allEventBeers = await this.prisma.eventBeer.groupBy({
        by: ['userId'],
        where: {
          eventId: event.id,
          deletedAt: null,
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      });

      const rank =
        allEventBeers.findIndex((eb) => eb.userId === userId) + 1 ||
        event.users.length;

      eventStats.push({
        eventId: event.id,
        eventName: event.name,
        beerCount: eventBeers.length,
        rank,
        totalParticipants: event.users.length,
      });
    }

    return eventStats;
  }
}
