import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { User } from './entities/user.entity';
import { Beer } from '../beers/entities/beer.entity';
import { Event } from '../events/entities/event.entity';
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
  ) {}

  async getUserStats(userId: string): Promise<UserStatsDto> {
    const now = new Date();
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['beers', 'events'],
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get all beers for time-based calculations
    const beers = await this.beerRepository.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });

    // Basic stats
    const totalBeers = beers.length;
    const firstBeer = beers[0]?.createdAt || null;
    const lastBeer = beers[beers.length - 1]?.createdAt || null;

    // Calculate beers in recent time periods
    const beersLastHour = beers.filter((b) => b.createdAt >= subHours(now, 1)).length;
    const beersToday = beers.filter((b) => b.createdAt >= startOfToday()).length;
    const beersThisWeek = beers.filter((b) => b.createdAt >= startOfWeek(now)).length;
    const beersThisMonth = beers.filter((b) => b.createdAt >= startOfMonth(now)).length;

    // Calculate averages
    const daysSinceFirstBeer = firstBeer
      ? Math.max(1, differenceInHours(now, firstBeer) / 24)
      : 1;
    const averageBeersPerDay = totalBeers / daysSinceFirstBeer;

    // Calculate longest break
    let longestBreak = 0;
    for (let i = 1; i < beers.length; i++) {
      const breakHours = differenceInHours(
        beers[i].createdAt,
        beers[i - 1].createdAt,
      );
      longestBreak = Math.max(longestBreak, breakHours);
    }

    // Calculate hourly distribution
    const hourlyDistribution: TimeDistributionDto[] = Array.from(
      { length: 24 },
      (_, i) => ({
        hour: i,
        count: beers.filter((b) => new Date(b.createdAt).getHours() === i).length,
      }),
    );

    // Calculate daily stats (last 30 days)
    const dailyStats: DailyStatsDto[] = [];
    for (let i = 0; i < 30; i++) {
      const date = format(subDays(now, i), 'yyyy-MM-dd');
      const count = beers.filter(
        (b) => format(b.createdAt, 'yyyy-MM-dd') === date,
      ).length;
      dailyStats.unshift({ date, count });
    }

    // Calculate most beers in a day
    const mostBeersInDay = Math.max(...dailyStats.map((d) => d.count));

    // Get event statistics
    const eventStats = await this.getEventStats(userId);

    // Calculate rankings
    const allUsers = await this.userRepository.find({
      relations: ['beers'],
    });
    const rankedUsers = allUsers
      .map((u) => ({ id: u.id, beerCount: u.beers.length }))
      .sort((a, b) => b.beerCount - a.beerCount);

    const globalRank = rankedUsers.findIndex((u) => u.id === userId) + 1;
    const totalUsers = rankedUsers.length;
    const percentile = (globalRank / totalUsers) * 100;

    // Calculate average beers per event
    const averageBeersPerEvent = eventStats.length > 0
      ? eventStats.reduce((acc, curr) => acc + curr.beerCount, 0) / eventStats.length
      : 0;

    return {
      // Basic Info
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,

      // Overall Stats
      totalBeers,
      averageBeersPerDay,
      averageBeersPerEvent,
      beersLastHour,
      beersToday,
      beersThisWeek,
      beersThisMonth,

      // Time-based Stats
      firstBeerDate: firstBeer,
      lastBeerDate: lastBeer,
      longestBreak,
      mostBeersInDay,

      // Distribution
      hourlyDistribution,
      dailyStats,

      // Event Stats
      eventStats,

      // Rankings
      globalRank,
      totalUsers,
      percentile,
    };
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

      // Get beers for this event's time period
      const eventBeers = await this.beerRepository.find({
        where: {
          userId,
          createdAt: Between(event.startDate, event.endDate || new Date()),
        },
      });

      // Get all users' beers for this event to calculate ranking
      const userBeers = await Promise.all(
        event.users.map(async (u) => ({
          userId: u.id,
          beerCount: (
            await this.beerRepository.find({
              where: {
                userId: u.id,
                createdAt: Between(
                  event.startDate,
                  event.endDate || new Date(),
                ),
              },
            })
          ).length,
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