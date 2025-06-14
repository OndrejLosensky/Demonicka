import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Beer } from '../beers/entities/beer.entity';
import { Event } from '../events/entities/event.entity';
import { EventBeer } from '../events/entities/event-beer.entity';
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
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Beer)
    private readonly beerRepository: Repository<Beer>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(EventBeer)
    private readonly eventBeerRepository: Repository<EventBeer>,
  ) {}

  async getUserStats(userId: string): Promise<UserStatsDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['beers', 'events'],
    });

    if (!user) {
      throw new Error('User not found');
    }

    const now = new Date();
    const beers = user.beers || [];
    const events = user.events || [];

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

    const firstBeerDate = sortedBeers.length > 0 ? sortedBeers[0].createdAt : null;
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
        const eventBeers = beers.filter(
          (beer) =>
            event.startDate <= beer.createdAt &&
            beer.createdAt <= (event.endDate ?? new Date()),
        );

        const participants = await this.userRepository.count({
          where: { events: { id: event.id } },
        });

        return {
          eventId: event.id,
          eventName: event.name,
          beerCount: eventBeers.length,
          rank: 0, // TODO: Implement ranking logic
          totalParticipants: participants,
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
    const allUsers = await this.userRepository.find({
      select: ['id', 'beerCount'],
    });

    const sortedUsers = allUsers.sort((a, b) => b.beerCount - a.beerCount);
    const globalRank =
      sortedUsers.findIndex((u) => u.id === userId) + 1;
    const totalUsers = sortedUsers.length;
    const percentile = (globalRank / totalUsers) * 100;

    const stats: UserStatsDto = {
      // Basic Info
      userId: user.id,
      username: user.username,
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
      hourlyDistribution: Object.entries(hourlyDistribution).map(([hour, count]) => ({
        hour: parseInt(hour),
        count,
      })),
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
    const events = await this.eventRepository.find({
      relations: ['users', 'barrels'],
    });

    const eventStats: EventStatsDto[] = [];

    for (const event of events) {
      // Check if user participated in this event
      if (!event.users.some((u) => u.id === userId)) {
        continue;
      }

      // Get beers for this event using event_beers table
      const eventBeers = await this.eventBeerRepository.find({
        where: {
          eventId: event.id,
          userId,
        },
      });

      // Get all users' beers for this event to calculate ranking using event_beers
      const userBeers = await Promise.all(
        event.users.map(async (u) => ({
          userId: u.id,
          beerCount: await this.eventBeerRepository.count({
            where: {
              eventId: event.id,
              userId: u.id,
            },
          }),
        })),
      );

      // Sort users by beer count to get ranking
      const sortedUsers = userBeers.sort((a, b) => b.beerCount - a.beerCount);
      const rank = sortedUsers.findIndex((u) => u.userId === userId) + 1;

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