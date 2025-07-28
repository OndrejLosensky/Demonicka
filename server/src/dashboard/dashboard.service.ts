import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Beer } from '../beers/entities/beer.entity';
import { Barrel } from '../barrels/entities/barrel.entity';
import { Event } from '../events/entities/event.entity';
import { EventBeer } from '../events/entities/event-beer.entity';
import { DashboardResponseDto, UserStatsDto, BarrelStatsDto } from './dto/dashboard.dto';
import { LeaderboardDto, UserLeaderboardDto } from './dto/leaderboard.dto';
import { PublicStatsDto } from './dto/public-stats.dto';
import { SystemStatsDto } from './dto/system-stats.dto';
import { PersonalStatsDto, EventStatsDto, HourlyStatsDto } from './dto/personal-stats.dto';
import { UserRole } from '../users/enums/user-role.enum';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);
  private lastFetch: number = 0;
  private cachedStats: SystemStatsDto | null = null;
  private readonly CACHE_TTL = 30000; // 30 seconds in milliseconds

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Beer)
    private readonly beerRepository: Repository<Beer>,
    @InjectRepository(Barrel)
    private readonly barrelRepository: Repository<Barrel>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(EventBeer)
    private readonly eventBeerRepository: Repository<EventBeer>,
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

      // Get beer count for event users using event_beers table
      const totalBeers = await this.eventBeerRepository
        .createQueryBuilder('event_beer')
        .where('event_beer.eventId = :eventId', { eventId: event.id })
        .getCount();

      // Get top users for this event using event_beers
      const usersWithBeerCounts = eventUserIds.length > 0
        ? await this.userRepository
            .createQueryBuilder('user')
            .leftJoin(
              'user.eventBeers',
              'event_beer',
              'event_beer.eventId = :eventId',
              { eventId: event.id },
            )
            .select([
              'user.username as username',
              'COUNT(event_beer.id) as beerCount',
            ])
            .where('user.id IN (:...ids)', { ids: eventUserIds })
            .groupBy('user.id')
            .orderBy('beerCount', 'DESC')
            .limit(6)
            .getRawMany<{ username: string; beerCount: string }>()
        : [];

      const topUsers = usersWithBeerCounts.map((u) => ({
        username: u.username,
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
        .select(['user.username as username', 'COUNT(beer.id) as beerCount'])
        .groupBy('user.id')
        .orderBy('beerCount', 'DESC')
        .limit(6)
        .getRawMany<{ username: string; beerCount: string }>();

      const topUsers = usersWithBeerCounts.map((u) => ({
        username: u.username,
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

      // Get beer count for event users using event_beers table
      const totalBeers = await this.eventBeerRepository
        .createQueryBuilder('event_beer')
        .where('event_beer.eventId = :eventId', { eventId: event.id })
        .getCount();

      const totalUsers = event.users.length;
      const totalBarrels = event.barrels.length;
      const averageBeersPerUser = totalUsers
        ? totalBeers / totalUsers
        : 0;

      // Get top users for this event using event_beers
      const usersWithBeerCounts = eventUserIds.length > 0
        ? await this.userRepository
            .createQueryBuilder('user')
            .leftJoin(
              'user.eventBeers',
              'event_beer',
              'event_beer.eventId = :eventId',
              { eventId: event.id },
            )
            .select([
              'user.id as id',
              'user.username as username',
              'COUNT(event_beer.id) as beerCount',
            ])
            .where('user.id IN (:...ids)', { ids: eventUserIds })
            .groupBy('user.id')
            .orderBy('beerCount', 'DESC')
            .getRawMany<{ id: string; username: string; beerCount: string }>()
        : [];

      const topUsers: UserStatsDto[] = usersWithBeerCounts.map((u) => ({
        id: u.id,
        username: u.username,
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
          'user.username as username',
          'COUNT(beer.id) as beerCount',
        ])
        .groupBy('user.id')
        .orderBy('beerCount', 'DESC')
        .getRawMany<{ id: string; username: string; beerCount: string }>();

      const topUsers: UserStatsDto[] = usersWithBeerCounts.map((u) => ({
        id: u.id,
        username: u.username,
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
            .leftJoin('user.eventBeers', 'event_beer', 'event_beer.eventId = :eventId', { eventId: event.id })
            .select([
              'user.id as id',
              'user.username as username',
              'user.gender as gender',
              'COUNT(event_beer.id) as beerCount',
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
          'user.username as username',
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

  async getSystemStats(): Promise<SystemStatsDto> {
    const now = Date.now();
    
    // Return cached data if it's still fresh
    if (this.cachedStats && (now - this.lastFetch) < this.CACHE_TTL) {
      this.logger.log('Returning cached system stats');
      return this.cachedStats;
    }

    this.logger.log('Cache miss - fetching fresh system stats');
    
    try {
      const users = await this.userRepository.find({
        select: [
          'id',
          'username',
          'role',
          'isRegistrationComplete',
          'isTwoFactorEnabled',
          'isAdminLoginEnabled',
          'lastAdminLogin'
        ],
        where: {
          deletedAt: IsNull()
        }
      });

      this.logger.log(`Found ${users.length} users`);

      const stats = {
        users: users.map(user => ({
          id: user.id,
          username: user.username,
          role: user.role,
          isRegistrationComplete: user.isRegistrationComplete,
          isTwoFactorEnabled: user.isTwoFactorEnabled,
          isAdminLoginEnabled: user.isAdminLoginEnabled,
          lastAdminLogin: user.lastAdminLogin
        })),
        totalUsers: users.length,
        totalAdminUsers: users.filter(u => u.role === UserRole.ADMIN).length,
        totalCompletedRegistrations: users.filter(u => u.isRegistrationComplete).length,
        total2FAEnabled: users.filter(u => u.isTwoFactorEnabled).length
      };

      // Update cache
      this.cachedStats = stats;
      this.lastFetch = now;
      this.logger.log('System stats cached successfully');

      return stats;
    } catch (error) {
      this.logger.error('Failed to fetch system stats', error);
      throw error;
    }
  }

  async getPersonalStats(userId: string): Promise<PersonalStatsDto> {
    try {
      this.logger.log(`Fetching personal stats for user: ${userId}`);
      
      // Get total beers for the user
      const totalBeers = await this.beerRepository.count({
        where: { userId }
      });
      
      this.logger.log(`Total beers for user: ${totalBeers}`);

      // Get all events the user participated in
      const userEvents = await this.eventRepository
        .createQueryBuilder('event')
        .innerJoin('event.users', 'user', 'user.id = :userId', { userId })
        .select(['event.id', 'event.name'])
        .getMany();
        
      this.logger.log(`User events count: ${userEvents.length}`);

      const eventStats: EventStatsDto[] = [];

      for (const event of userEvents) {
        // Get user's beers for this event
        const userBeers = await this.eventBeerRepository.count({
          where: { eventId: event.id, userId }
        });

        // Get total beers for this event
        const totalEventBeers = await this.eventBeerRepository.count({
          where: { eventId: event.id }
        });

        // Calculate contribution percentage
        const contribution = totalEventBeers > 0 ? (userBeers / totalEventBeers) * 100 : 0;

        // Get hourly stats for this event
        const hourlyStats = await this.eventBeerRepository
          .createQueryBuilder('event_beer')
          .select([
            'strftime("%H", event_beer.consumedAt) as hour',
            'COUNT(*) as count'
          ])
          .where('event_beer.eventId = :eventId', { eventId: event.id })
          .andWhere('event_beer.userId = :userId', { userId })
          .groupBy('strftime("%H", event_beer.consumedAt)')
          .orderBy('hour', 'ASC')
          .getRawMany<{ hour: string; count: string }>();

        const formattedHourlyStats: HourlyStatsDto[] = hourlyStats.map(stat => ({
          hour: parseInt(stat.hour),
          count: parseInt(stat.count)
        }));

        // Calculate average per hour
        const totalHours = formattedHourlyStats.length > 0 ? 
          Math.max(...formattedHourlyStats.map(h => h.hour)) - Math.min(...formattedHourlyStats.map(h => h.hour)) + 1 : 1;
        const averagePerHour = totalHours > 0 ? userBeers / totalHours : 0;

        eventStats.push({
          eventId: event.id,
          eventName: event.name,
          userBeers,
          totalEventBeers,
          contribution,
          hourlyStats: formattedHourlyStats,
          averagePerHour
        });
      }

      return {
        totalBeers,
        eventStats
      };
    } catch (error) {
      this.logger.error('Failed to fetch personal stats', error);
      throw error;
    }
  }
}
