import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Beer } from '../beers/entities/beer.entity';
import { Barrel } from '../barrels/entities/barrel.entity';
import { Event } from '../events/entities/event.entity';
import {
  DashboardResponseDto,
  UserStatsDto,
  BarrelStatsDto,
} from './dto/dashboard.dto';
import {
  LeaderboardDto,
  UserLeaderboardDto,
} from './dto/leaderboard.dto';
import { PublicStatsDto } from './dto/public-stats.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Beer)
    private readonly beerRepository: Repository<Beer>,
    @InjectRepository(Barrel)
    private readonly barrelRepository: Repository<Barrel>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  async getPublicStats(eventId?: string): Promise<PublicStatsDto> {
    let event: Event | null = null;
    
    if (eventId) {
      event = await this.eventRepository.findOne({
        where: { id: eventId },
        relations: ['users', 'barrels'],
      });
      
      if (!event) {
        throw new Error('Event not found');
      }
    }

    if (event) {
      // Event-specific stats
      const eventUserIds = event.users.map((u) => u.id);
      const eventBarrelIds = event.barrels.map((b) => b.id);

      // Get beer count for event users
      const totalBeers = eventUserIds.length > 0
        ? await this.beerRepository
            .createQueryBuilder('beer')
            .where('beer.userId IN (:...ids)', { ids: eventUserIds })
            .getCount()
        : 0;

      // Get top users for this event
      const usersWithBeerCounts = eventUserIds.length > 0
        ? await this.userRepository
            .createQueryBuilder('user')
            .leftJoin('user.beers', 'beer')
            .select(['user.name as name', 'COUNT(beer.id) as beerCount'])
            .where('user.id IN (:...ids)', { ids: eventUserIds })
            .groupBy('user.id')
            .orderBy('beerCount', 'DESC')
            .limit(6)
            .getRawMany<{ name: string; beerCount: string }>()
        : [];

      const topUsers = usersWithBeerCounts.map((u) => ({
        name: u.name,
        beerCount: parseInt(u.beerCount),
      }));

      // Get barrel statistics for this event
      const barrelStats = eventBarrelIds.length > 0
        ? await this.barrelRepository
            .createQueryBuilder('barrel')
            .select(['barrel.size as size', 'COUNT(*) as count'])
            .where('barrel.id IN (:...ids)', { ids: eventBarrelIds })
            .groupBy('barrel.size')
            .getRawMany<{ size: string; count: string }>()
        : [];

      const formattedBarrelStats = barrelStats.map((stat) => ({
        size: parseInt(stat.size),
        count: parseInt(stat.count),
      }));

      return {
        totalBeers,
        totalUsers: event.users.length,
        totalBarrels: event.barrels.length,
        topUsers,
        barrelStats: formattedBarrelStats,
      };
    } else {
      // Global stats
      const totalUsers = await this.userRepository.count();
      const totalBeers = await this.beerRepository.count();
      const totalBarrels = await this.barrelRepository.count();

      const usersWithBeerCounts = await this.userRepository
        .createQueryBuilder('user')
        .leftJoin('user.beers', 'beer')
        .select(['user.name as name', 'COUNT(beer.id) as beerCount'])
        .groupBy('user.id')
        .orderBy('beerCount', 'DESC')
        .limit(6)
        .getRawMany<{ name: string; beerCount: string }>();

      const topUsers = usersWithBeerCounts.map((u) => ({
        name: u.name,
        beerCount: parseInt(u.beerCount),
      }));

      const barrelStats = await this.barrelRepository
        .createQueryBuilder('barrel')
        .select(['barrel.size as size', 'COUNT(*) as count'])
        .groupBy('barrel.size')
        .getRawMany<{ size: string; count: string }>();

      const formattedBarrelStats = barrelStats.map((stat) => ({
        size: parseInt(stat.size),
        count: parseInt(stat.count),
      }));

      return {
        totalBeers,
        totalUsers,
        totalBarrels,
        topUsers,
        barrelStats: formattedBarrelStats,
      };
    }
  }

  async getDashboardStats(eventId?: string): Promise<DashboardResponseDto> {
    let event: Event | null = null;
    
    if (eventId) {
      event = await this.eventRepository.findOne({
        where: { id: eventId },
        relations: ['users', 'barrels'],
      });
      
      if (!event) {
        throw new Error('Event not found');
      }
    }

    if (event) {
      // Event-specific stats
      const eventUserIds = event.users.map((u) => u.id);
      const eventBarrelIds = event.barrels.map((b) => b.id);

      // Get beer count for event users
      const totalBeers = eventUserIds.length > 0
        ? await this.beerRepository
            .createQueryBuilder('beer')
            .where('beer.userId IN (:...ids)', { ids: eventUserIds })
            .getCount()
        : 0;

      const totalUsers = event.users.length;
      const totalBarrels = event.barrels.length;
      const averageBeersPerUser = totalUsers
        ? totalBeers / totalUsers
        : 0;

      // Get top users for this event
      const usersWithBeerCounts = eventUserIds.length > 0
        ? await this.userRepository
            .createQueryBuilder('user')
            .leftJoin('user.beers', 'beer')
            .select([
              'user.id as id',
              'user.name as name',
              'COUNT(beer.id) as beerCount',
            ])
            .where('user.id IN (:...ids)', { ids: eventUserIds })
            .groupBy('user.id')
            .orderBy('beerCount', 'DESC')
            .getRawMany<{ id: string; name: string; beerCount: string }>()
        : [];

      const topUsers: UserStatsDto[] = usersWithBeerCounts.map((u) => ({
        id: u.id,
        name: u.name,
        beerCount: parseInt(u.beerCount),
      }));

      // Get barrel statistics for this event
      const barrelStats = eventBarrelIds.length > 0
        ? await this.barrelRepository
            .createQueryBuilder('barrel')
            .select(['barrel.size as size', 'COUNT(*) as count'])
            .where('barrel.id IN (:...ids)', { ids: eventBarrelIds })
            .groupBy('barrel.size')
            .getRawMany<{ size: string; count: string }>()
        : [];

      const formattedBarrelStats: BarrelStatsDto[] = barrelStats.map((stat) => ({
        size: parseInt(stat.size),
        count: parseInt(stat.count),
      }));

      return {
        totalBeers,
        totalUsers,
        totalBarrels,
        averageBeersPerUser,
        topUsers,
        barrelStats: formattedBarrelStats,
      };
    } else {
      // Global stats
      const totalUsers = await this.userRepository.count();
      const totalBeers = await this.beerRepository.count();
      const totalBarrels = await this.barrelRepository.count();
      const averageBeersPerUser = totalUsers
        ? totalBeers / totalUsers
        : 0;

      const usersWithBeerCounts = await this.userRepository
        .createQueryBuilder('user')
        .leftJoin('user.beers', 'beer')
        .select([
          'user.id as id',
          'user.name as name',
          'COUNT(beer.id) as beerCount',
        ])
        .groupBy('user.id')
        .orderBy('beerCount', 'DESC')
        .getRawMany<{ id: string; name: string; beerCount: string }>();

      const topUsers: UserStatsDto[] = usersWithBeerCounts.map((u) => ({
        id: u.id,
        name: u.name,
        beerCount: parseInt(u.beerCount),
      }));

      const barrelStats = await this.barrelRepository
        .createQueryBuilder('barrel')
        .select(['barrel.size as size', 'COUNT(*) as count'])
        .groupBy('barrel.size')
        .getRawMany<{ size: string; count: string }>();

      const formattedBarrelStats: BarrelStatsDto[] = barrelStats.map((stat) => ({
        size: parseInt(stat.size),
        count: parseInt(stat.count),
      }));

      return {
        totalBeers,
        totalUsers,
        totalBarrels,
        averageBeersPerUser,
        topUsers,
        barrelStats: formattedBarrelStats,
      };
    }
  }

  async getLeaderboard(eventId?: string): Promise<LeaderboardDto> {
    let event: Event | null = null;
    
    if (eventId) {
      event = await this.eventRepository.findOne({
        where: { id: eventId },
        relations: ['users'],
      });
      
      if (!event) {
        throw new Error('Event not found');
      }
    }

    if (event) {
      // Event-specific leaderboard
      const eventUserIds = event.users.map((u) => u.id);
      
      const users = eventUserIds.length > 0
        ? await this.userRepository
            .createQueryBuilder('user')
            .leftJoin('user.beers', 'beer')
            .select([
              'user.id as id',
              'user.name as name',
              'user.gender as gender',
              'COUNT(beer.id) as beerCount',
            ])
            .where('user.id IN (:...ids)', { ids: eventUserIds })
            .groupBy('user.id')
            .orderBy('beerCount', 'DESC')
            .getRawMany<UserLeaderboardDto>()
        : [];

      return {
        males: users
          .filter((u) => u.gender === 'MALE')
          .map((u) => ({
            ...u,
            beerCount: parseInt(u.beerCount as unknown as string),
          })),
        females: users
          .filter((u) => u.gender === 'FEMALE')
          .map((u) => ({
            ...u,
            beerCount: parseInt(u.beerCount as unknown as string),
          })),
      };
    } else {
      // Global leaderboard
      const users = await this.userRepository
        .createQueryBuilder('user')
        .leftJoin('user.beers', 'beer')
        .select([
          'user.id as id',
          'user.name as name',
          'user.gender as gender',
          'COUNT(beer.id) as beerCount',
        ])
        .groupBy('user.id')
        .orderBy('beerCount', 'DESC')
        .getRawMany<UserLeaderboardDto>();

      return {
        males: users
          .filter((u) => u.gender === 'MALE')
          .map((u) => ({
            ...u,
            beerCount: parseInt(u.beerCount as unknown as string),
          })),
        females: users
          .filter((u) => u.gender === 'FEMALE')
          .map((u) => ({
            ...u,
            beerCount: parseInt(u.beerCount as unknown as string),
          })),
      };
    }
  }
}
