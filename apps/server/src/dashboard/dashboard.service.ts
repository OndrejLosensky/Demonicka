import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardResponseDto, UserStatsDto, BarrelStatsDto } from './dto/dashboard.dto';
import { LeaderboardDto, UserLeaderboardDto } from './dto/leaderboard.dto';
import { PublicStatsDto } from './dto/public-stats.dto';
import { SystemStatsDto } from './dto/system-stats.dto';
import { PersonalStatsDto, EventStatsDto, HourlyStatsDto } from './dto/personal-stats.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);
  private lastFetch: number = 0;
  private cachedStats: SystemStatsDto | null = null;
  private readonly CACHE_TTL = 30000; // 30 seconds in milliseconds

  constructor(private prisma: PrismaService) {}

  async getPublicStats(eventId?: string): Promise<PublicStatsDto> {
    if (eventId) {
      const event = await this.prisma.event.findUnique({
        where: { id: eventId },
        include: {
          users: { include: { user: true } },
          barrels: { include: { barrel: true } },
        },
      });
      
      if (!event) {
        throw new Error('Event not found');
      }

      // Event-specific stats
      const eventUserIds = event.users.map((eu) => eu.userId);
      const eventBarrelIds = event.barrels.map((eb) => eb.barrelId);

      // Get beer count for event users using event_beers table
      const totalBeers = await this.prisma.eventBeer.count({
        where: {
          eventId: event.id,
          userId: { in: eventUserIds },
          deletedAt: null,
        },
      });

      // Get top users for this event using event_beers
      const eventBeerCounts = await this.prisma.eventBeer.groupBy({
        by: ['userId'],
        where: {
          eventId: event.id,
          userId: { in: eventUserIds },
          deletedAt: null,
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 6,
      });

      const userIds = eventBeerCounts.map(eb => eb.userId);
      const users = await this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, username: true },
      });

      const topUsers = eventBeerCounts.map(eb => {
        const user = users.find(u => u.id === eb.userId);
        return {
          username: user?.username || '',
          beerCount: eb._count.id,
        };
      });

      // Get barrel statistics for this event
      const barrels = await this.prisma.barrel.findMany({
        where: {
          id: { in: eventBarrelIds },
          deletedAt: null,
        },
        select: { size: true },
      });

      const barrelStatsMap = new Map<number, number>();
      barrels.forEach(barrel => {
        barrelStatsMap.set(barrel.size, (barrelStatsMap.get(barrel.size) || 0) + 1);
      });

      const formattedBarrelStats = Array.from(barrelStatsMap.entries()).map(([size, count]) => ({
        size,
        count,
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
      const totalUsers = await this.prisma.user.count({ where: { deletedAt: null } });
      const totalBeers = await this.prisma.beer.count({ where: { deletedAt: null } });
      const totalBarrels = await this.prisma.barrel.count({ where: { deletedAt: null } });

      // Get top users by beer count
      const topUsersData = await this.prisma.user.findMany({
        where: { deletedAt: null },
        select: { id: true, username: true, beerCount: true },
        orderBy: { beerCount: 'desc' },
        take: 6,
      });

      const topUsers = topUsersData.map(u => ({
        username: u.username || '',
        beerCount: u.beerCount || 0,
      }));

      // Get barrel statistics
      const barrels = await this.prisma.barrel.findMany({
        where: { deletedAt: null },
        select: { size: true },
      });

      const barrelStatsMap = new Map<number, number>();
      barrels.forEach(barrel => {
        barrelStatsMap.set(barrel.size, (barrelStatsMap.get(barrel.size) || 0) + 1);
      });

      const formattedBarrelStats = Array.from(barrelStatsMap.entries()).map(([size, count]) => ({
        size,
        count,
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
    if (eventId) {
      const event = await this.prisma.event.findUnique({
        where: { id: eventId },
        include: {
          users: { include: { user: true } },
          barrels: { include: { barrel: true } },
        },
      });
      
      if (!event) {
        throw new Error('Event not found');
      }

      // Event-specific stats
      const eventUserIds = event.users.map((eu) => eu.userId);
      const eventBarrelIds = event.barrels.map((eb) => eb.barrelId);

      // Get beer count for event users using event_beers table
      const totalBeers = await this.prisma.eventBeer.count({
        where: {
          eventId: event.id,
          userId: { in: eventUserIds },
          deletedAt: null,
        },
      });

      const totalUsers = event.users.length;
      const totalBarrels = event.barrels.length;
      const averageBeersPerUser = totalUsers ? totalBeers / totalUsers : 0;

      // Get top users for this event using event_beers
      const eventBeerCounts = await this.prisma.eventBeer.groupBy({
        by: ['userId'],
        where: {
          eventId: event.id,
          userId: { in: eventUserIds },
          deletedAt: null,
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      });

      const userIds = eventBeerCounts.map(eb => eb.userId);
      const users = await this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, username: true },
      });

      const topUsers: UserStatsDto[] = eventBeerCounts.map(eb => {
        const user = users.find(u => u.id === eb.userId);
        return {
          id: eb.userId,
          username: user?.username || '',
          beerCount: eb._count.id,
        };
      });

      // Get barrel statistics for this event
      const barrels = await this.prisma.barrel.findMany({
        where: {
          id: { in: eventBarrelIds },
          deletedAt: null,
        },
        select: { size: true },
      });

      const barrelStatsMap = new Map<number, number>();
      barrels.forEach(barrel => {
        barrelStatsMap.set(barrel.size, (barrelStatsMap.get(barrel.size) || 0) + 1);
      });

      const formattedBarrelStats: BarrelStatsDto[] = Array.from(barrelStatsMap.entries()).map(([size, count]) => ({
        size,
        count,
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
      const totalUsers = await this.prisma.user.count({ where: { deletedAt: null } });
      const totalBeers = await this.prisma.beer.count({ where: { deletedAt: null } });
      const totalBarrels = await this.prisma.barrel.count({ where: { deletedAt: null } });
      const averageBeersPerUser = totalUsers ? totalBeers / totalUsers : 0;

      // Get top users by beer count
      const topUsersData = await this.prisma.user.findMany({
        where: { deletedAt: null },
        select: { id: true, username: true, beerCount: true },
        orderBy: { beerCount: 'desc' },
        take: 10,
      });

      const topUsers: UserStatsDto[] = topUsersData.map(u => ({
        id: u.id,
        username: u.username || '',
        beerCount: u.beerCount || 0,
      }));

      // Get barrel statistics
      const barrels = await this.prisma.barrel.findMany({
        where: { deletedAt: null },
        select: { size: true },
      });

      const barrelStatsMap = new Map<number, number>();
      barrels.forEach(barrel => {
        barrelStatsMap.set(barrel.size, (barrelStatsMap.get(barrel.size) || 0) + 1);
      });

      const formattedBarrelStats: BarrelStatsDto[] = Array.from(barrelStatsMap.entries()).map(([size, count]) => ({
        size,
        count,
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

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        users: { include: { user: true } },
      },
    });
    
    if (!event) {
      throw new Error('Event not found');
    }

    this.logger.log(`Event found: ${event.name} with ${event.users.length} users`);

    // Event-specific leaderboard only
    const eventUserIds = event.users.map((eu) => eu.userId);
    
    // Get total event beers
    const totalEventBeers = await this.prisma.eventBeer.count({
      where: {
        eventId: event.id,
        userId: { in: eventUserIds },
        deletedAt: null,
      },
    });
    
    this.logger.log(`Total event beers from event_beers table for event ${event.id}: ${totalEventBeers}`);
    
    // Get user rankings with their individual beer counts
    const eventBeerCounts = await this.prisma.eventBeer.groupBy({
      by: ['userId'],
      where: {
        eventId: event.id,
        userId: { in: eventUserIds },
        deletedAt: null,
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const userIds = eventBeerCounts.map(eb => eb.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, gender: true },
    });

    const userMap = new Map(users.map(u => [u.id, u]));
    const beerCountMap = new Map(eventBeerCounts.map(eb => [eb.userId, eb._count.id]));

    // Include users with 0 beers
    eventUserIds.forEach(userId => {
      if (!beerCountMap.has(userId)) {
        beerCountMap.set(userId, 0);
      }
      if (!userMap.has(userId)) {
        const eventUser = event.users.find(eu => eu.userId === userId);
        if (eventUser) {
          userMap.set(userId, eventUser.user);
        }
      }
    });

    // Get all eventBeers to determine when users reached their current beer count
    const allEventBeers = await this.prisma.eventBeer.findMany({
      where: {
        eventId: event.id,
        userId: { in: eventUserIds },
        deletedAt: null,
      },
      select: {
        userId: true,
        consumedAt: true,
      },
      orderBy: {
        consumedAt: 'asc',
      },
    });

    // Group beers by userId and calculate timestamp when user reached current count
    const userBeersMap = new Map<string, Date[]>();
    allEventBeers.forEach(beer => {
      if (!userBeersMap.has(beer.userId)) {
        userBeersMap.set(beer.userId, []);
      }
      userBeersMap.get(beer.userId)!.push(beer.consumedAt);
    });

    // Helper function to get timestamp when user reached their current beer count
    const getReachedAtTimestamp = (userId: string, beerCount: number): Date => {
      const beers = userBeersMap.get(userId) || [];
      if (beerCount === 0 || beers.length === 0) {
        return new Date(0); // Users with 0 beers get timestamp 0 (sorted last)
      }
      // Get the timestamp of the nth beer (where n is the current beerCount)
      const nthBeerIndex = Math.min(beerCount - 1, beers.length - 1);
      return beers[nthBeerIndex];
    };

    const allUsers = Array.from(userMap.entries()).map(([userId, user]) => ({
      id: userId,
      username: user.username || '',
      gender: user.gender,
      beerCount: beerCountMap.get(userId) || 0,
      reachedAt: getReachedAtTimestamp(userId, beerCountMap.get(userId) || 0),
    })).sort((a, b) => {
      // Sort by beerCount desc, then by reachedAt asc (earlier = reached that count first)
      if (b.beerCount !== a.beerCount) {
        return b.beerCount - a.beerCount;
      }
      return a.reachedAt.getTime() - b.reachedAt.getTime();
    });

    // Calculate shared ranks (dense ranking: users with same beer count share rank, next rank increments by 1)
    type UserWithReachedAt = typeof allUsers[0];
    type UserWithRank = UserWithReachedAt & { rank: number };
    
    const calculateRanks = (users: UserWithReachedAt[]): UserWithRank[] => {
      let currentRank = 1;
      const result: UserWithRank[] = [];
      
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        if (i > 0 && users[i - 1].beerCount === user.beerCount) {
          // Same beer count as previous user - share the rank
          result.push({ ...user, rank: result[i - 1].rank });
        } else {
          // Different beer count or first user - assign new rank
          result.push({ ...user, rank: currentRank });
          currentRank += 1;
        }
      }
      
      return result;
    };

    // Split by gender first, then calculate ranks separately for each group
    const males = allUsers.filter((u) => u.gender === 'MALE');
    const females = allUsers.filter((u) => u.gender === 'FEMALE');
    
    const malesWithRanks = calculateRanks(males).map(({ reachedAt, ...user }) => user);
    const femalesWithRanks = calculateRanks(females).map(({ reachedAt, ...user }) => user);

    const result = {
      males: malesWithRanks,
      females: femalesWithRanks,
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
      const users = await this.prisma.user.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          username: true,
          role: true,
          isRegistrationComplete: true,
          isTwoFactorEnabled: true,
          canLogin: true,
          lastAdminLogin: true,
        },
      });

      this.logger.log(`Found ${users.length} users`);

      const stats = {
        users: users.map(user => ({
          id: user.id,
          username: user.username,
          role: user.role,
          isRegistrationComplete: user.isRegistrationComplete,
          isTwoFactorEnabled: user.isTwoFactorEnabled,
          canLogin: user.canLogin,
          lastAdminLogin: user.lastAdminLogin,
        })),
        totalUsers: users.length,
        totalOperatorUsers: users.filter(u => u.role === UserRole.OPERATOR || u.role === UserRole.SUPER_ADMIN).length,
        totalCompletedRegistrations: users.filter(u => u.isRegistrationComplete).length,
        total2FAEnabled: users.filter(u => u.isTwoFactorEnabled).length,
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
      const totalBeers = await this.prisma.beer.count({
        where: { userId, deletedAt: null },
      });
      
      this.logger.log(`Total beers for user: ${totalBeers}`);

      // Get all events the user participated in
      const userEvents = await this.prisma.eventUsers.findMany({
        where: { userId },
        include: { event: true },
      });

      const events = userEvents.map(eu => eu.event);
      this.logger.log(`User events count: ${events.length}`);

      const eventStats: EventStatsDto[] = [];

      for (const event of events) {
        // Get user's beers for this event
        const userBeers = await this.prisma.eventBeer.count({
          where: { eventId: event.id, userId, deletedAt: null },
        });

        // Get total beers for this event
        const totalEventBeers = await this.prisma.eventBeer.count({
          where: { eventId: event.id, deletedAt: null },
        });

        // Calculate contribution percentage
        const contribution = totalEventBeers > 0 ? (userBeers / totalEventBeers) * 100 : 0;

        // Get hourly stats for this event (using PostgreSQL date functions)
        const timezoneOffset = process.env.TIMEZONE_OFFSET || '+02:00';
        
        const hourlyStatsRaw = await this.prisma.$queryRaw<Array<{ hour: number; count: bigint }>>`
          SELECT 
            EXTRACT(HOUR FROM ("consumedAt" AT TIME ZONE ${timezoneOffset}))::int as hour,
            COUNT(*)::bigint as count
          FROM "EventBeer"
          WHERE "eventId" = ${event.id}::uuid
            AND "userId" = ${userId}::uuid
            AND "deletedAt" IS NULL
          GROUP BY hour
          ORDER BY hour ASC
        `;

        const formattedHourlyStats: HourlyStatsDto[] = hourlyStatsRaw.map(stat => ({
          hour: Number(stat.hour),
          count: Number(stat.count),
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
          averagePerHour,
        });
      }

      return {
        totalBeers,
        eventStats,
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
      const timezoneOffset = process.env.TIMEZONE_OFFSET || '+02:00';
      
      let hourlyStatsRaw: Array<{ hour: number; count: bigint }>;

      if (date) {
        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
        
        hourlyStatsRaw = await this.prisma.$queryRaw<Array<{ hour: number; count: bigint }>>`
          SELECT 
            EXTRACT(HOUR FROM ("consumedAt" AT TIME ZONE ${timezoneOffset}))::int as hour,
            COUNT(*)::bigint as count
          FROM "EventBeer"
          WHERE "eventId" = ${eventId}::uuid
            AND "deletedAt" IS NULL
            AND "consumedAt" >= ${startOfDay}::timestamptz
            AND "consumedAt" < ${endOfDay}::timestamptz
          GROUP BY hour
          ORDER BY hour ASC
        `;
      } else {
        hourlyStatsRaw = await this.prisma.$queryRaw<Array<{ hour: number; count: bigint }>>`
          SELECT 
            EXTRACT(HOUR FROM ("consumedAt" AT TIME ZONE ${timezoneOffset}))::int as hour,
            COUNT(*)::bigint as count
          FROM "EventBeer"
          WHERE "eventId" = ${eventId}::uuid
            AND "deletedAt" IS NULL
          GROUP BY hour
          ORDER BY hour ASC
        `;
      }

      const formattedHourlyStats: HourlyStatsDto[] = hourlyStatsRaw.map(stat => ({
        hour: Number(stat.hour),
        count: Number(stat.count),
      }));

      // Fill in missing hours with 0 count
      const allHours = Array.from({ length: 24 }, (_, i) => i);
      const existingHours = formattedHourlyStats.map(h => h.hour);
      
      const missingHours = allHours.filter(hour => !existingHours.includes(hour));
      const completeHourlyStats = [
        ...formattedHourlyStats,
        ...missingHours.map(hour => ({ hour, count: 0 })),
      ].sort((a, b) => a.hour - b.hour);

      this.logger.log(`Hourly stats fetched: ${completeHourlyStats.length} hours with timezone offset ${timezoneOffset}`);
      return completeHourlyStats;
    } catch (error) {
      this.logger.error('Failed to fetch hourly stats', error);
      throw error;
    }
  }
}
