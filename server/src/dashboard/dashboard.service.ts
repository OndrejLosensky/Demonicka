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

      // Get beer count for event users using event_beers table - ONLY from active users
      const totalBeers = await this.eventBeerRepository
        .createQueryBuilder('event_beer')
        .where('event_beer.eventId = :eventId', { eventId: event.id })
        .andWhere('event_beer.userId IN (:...userIds)', {
          userIds: eventUserIds,
        })
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

      // Get beer count for event users using event_beers table - ONLY from active users
      const totalBeers = await this.eventBeerRepository
        .createQueryBuilder('event_beer')
        .where('event_beer.eventId = :eventId', { eventId: event.id })
        .andWhere('event_beer.userId IN (:...userIds)', {
          userIds: eventUserIds,
        })
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
              'user.profilePicture as profilePicture',
              'COUNT(event_beer.id) as beerCount',
            ])
            .where('user.id IN (:...ids)', { ids: eventUserIds })
            .groupBy('user.id')
            .orderBy('beerCount', 'DESC')
            .getRawMany<{ id: string; username: string; profilePicture: string | null; beerCount: string }>()
        : [];

      const topUsers: UserStatsDto[] = usersWithBeerCounts.map((u) => ({
        id: u.id,
        username: u.username,
        beerCount: parseInt(u.beerCount),
        profilePicture: u.profilePicture,
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
          'user.profilePicture as profilePicture',
          'COUNT(beer.id) as beerCount',
        ])
        .groupBy('user.id')
        .orderBy('beerCount', 'DESC')
        .getRawMany<{ id: string; username: string; profilePicture: string | null; beerCount: string }>();

      const topUsers: UserStatsDto[] = usersWithBeerCounts.map((u) => ({
        id: u.id,
        username: u.username,
        beerCount: parseInt(u.beerCount),
        profilePicture: u.profilePicture,
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
    // Always require an eventId - no more global fallback
    if (!eventId) {
      throw new Error('Event ID is required for leaderboard');
    }

    this.logger.log(`Loading leaderboard for event: ${eventId}`);

    const event = await this.eventRepository.findOne({
      where: { id: eventId },
      relations: ['users'],
    });
    
    if (!event) {
      throw new Error('Event not found');
    }

    this.logger.log(`Event found: ${event.name} with ${event.users.length} users`);

    // Event-specific leaderboard only - STRICTLY filter by eventId
    const eventUserIds = event.users.map((u) => u.id);
    
    // Get total event beers using same method as dashboard - ONLY from active users
    const totalEventBeers = await this.eventBeerRepository
      .createQueryBuilder('event_beer')
      .where('event_beer.eventId = :eventId', { eventId: event.id })
      .andWhere('event_beer.userId IN (:...userIds)', {
        userIds: eventUserIds,
      })
      .getCount();
    
    this.logger.log(`Total event beers from event_beers table for event ${event.id}: ${totalEventBeers}`);
    
    // Get user rankings with their individual beer counts - STRICTLY for this event only
    const users = eventUserIds.length > 0
      ? await this.userRepository
          .createQueryBuilder('user')
          .leftJoin('user.eventBeers', 'event_beer', 'event_beer.eventId = :eventId', { eventId: event.id })
          .select([
            'user.id as id',
            'user.username as username',
            'user.gender as gender',
            'user.profilePicture as profilePicture',
            'COALESCE(COUNT(event_beer.id), 0) as beerCount',
          ])
          .where('user.id IN (:...ids)', { ids: eventUserIds })
          .groupBy('user.id')
          .orderBy('beerCount', 'DESC')
          .getRawMany<UserLeaderboardDto>()
      : [];

    const result = {
      males: users
        .filter((u) => u.gender === 'MALE')
        .map((u) => ({
          ...u,
          beerCount: parseInt(u.beerCount as unknown as string),
          profilePicture: u.profilePicture,
        })),
      females: users
        .filter((u) => u.gender === 'FEMALE')
        .map((u) => ({
          ...u,
          beerCount: parseInt(u.beerCount as unknown as string),
          profilePicture: u.profilePicture,
        })),
    };

    const totalBeers = result.males.reduce((sum, u) => sum + u.beerCount, 0) + 
                      result.females.reduce((sum, u) => sum + u.beerCount, 0);
    
    this.logger.log(`Leaderboard result: ${result.males.length} males, ${result.females.length} females, total beers: ${totalBeers}`);
    this.logger.log(`Verification: Direct count from event_beers table: ${totalEventBeers}, Sum from user counts: ${totalBeers}`);
    
    // Verify our counts match
    if (totalBeers !== totalEventBeers) {
      this.logger.warn(`COUNT MISMATCH! Direct count: ${totalEventBeers}, User sum: ${totalBeers}`);
    }
    
    return result;
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
        const timezoneOffset = process.env.TIMEZONE_OFFSET || '+2';
        
        // Get hourly stats for this event
        const hourlyStats = await this.eventBeerRepository
          .createQueryBuilder('event_beer')
          .select([
            `strftime("%H", datetime(event_beer.consumedAt, "${timezoneOffset} hours")) as hour`,
            'COUNT(*) as count'
          ])
          .where('event_beer.eventId = :eventId', { eventId: event.id })
          .andWhere('event_beer.userId = :userId', { userId })
          .groupBy(`strftime("%H", datetime(event_beer.consumedAt, "${timezoneOffset} hours"))`)
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

  async getEventHourlyStats(eventId: string, date?: string): Promise<HourlyStatsDto[]> {
    try {
      this.logger.log(`Fetching hourly stats for event: ${eventId}, date: ${date || 'current day'}`);
      
      // Get timezone offset from environment or default to UTC+2
      const timezoneOffset = process.env.TIMEZONE_OFFSET || '+2';
      
      // Build the query
      const queryBuilder = this.eventBeerRepository
        .createQueryBuilder('event_beer')
        .select([
          `strftime("%H", datetime(event_beer.consumedAt, "${timezoneOffset} hours")) as hour`,
          'COUNT(*) as count'
        ])
        .where('event_beer.eventId = :eventId', { eventId });
      
      // Add date filter if provided
      if (date) {
        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
        
        queryBuilder.andWhere('event_beer.consumedAt >= :startOfDay', { startOfDay })
                  .andWhere('event_beer.consumedAt < :endOfDay', { endOfDay });
      }
      
      const hourlyStats = await queryBuilder
        .groupBy(`strftime("%H", datetime(event_beer.consumedAt, "${timezoneOffset} hours"))`)
        .orderBy('hour', 'ASC')
        .getRawMany<{ hour: string; count: string }>();

      const formattedHourlyStats: HourlyStatsDto[] = hourlyStats.map(stat => ({
        hour: parseInt(stat.hour),
        count: parseInt(stat.count)
      }));

      // Fill in missing hours with 0 count
      const allHours = Array.from({ length: 24 }, (_, i) => i);
      const existingHours = formattedHourlyStats.map(h => h.hour);
      
      const missingHours = allHours.filter(hour => !existingHours.includes(hour));
      const completeHourlyStats = [
        ...formattedHourlyStats,
        ...missingHours.map(hour => ({ hour, count: 0 }))
      ].sort((a, b) => a.hour - b.hour);

      this.logger.log(`Hourly stats fetched: ${completeHourlyStats.length} hours with timezone offset ${timezoneOffset}`);
      return completeHourlyStats;
    } catch (error) {
      this.logger.error('Failed to fetch hourly stats', error);
      throw error;
    }
  }
}
