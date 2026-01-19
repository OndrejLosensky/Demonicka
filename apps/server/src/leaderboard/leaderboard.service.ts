import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  LeaderboardDto,
  UserLeaderboardDto,
} from '../dashboard/dto/leaderboard.dto';

interface RawEventBeerStats {
  id: string;
  username: string;
  name: string | null;
  gender: 'MALE' | 'FEMALE';
  beerCount: string;
  lastBeerTime: Date;
}

@Injectable()
export class LeaderboardService {
  constructor(private prisma: PrismaService) {}

  async getLeaderboard(eventId?: string): Promise<LeaderboardDto> {
    if (eventId) {
      // Get all event participants with their event-specific beer counts
      const eventUsers = await this.prisma.eventUsers.findMany({
        where: { eventId },
        include: {
          user: true,
        },
      });

      // Get beer counts for each user in the event
      const userIds = eventUsers.map((eu) => eu.userId);
      const eventBeers = await this.prisma.eventBeer.groupBy({
        by: ['userId'],
        where: {
          eventId,
          userId: { in: userIds },
          deletedAt: null,
        },
        _count: { id: true },
      });

      const beerCountMap = new Map<string, number>();
      eventBeers.forEach((eb) => {
        beerCountMap.set(eb.userId, eb._count.id);
      });

      const users = eventUsers
        .map((eu) => ({
          id: eu.user.id,
          username: eu.user.username || '',
          gender: eu.user.gender,
          beerCount: beerCountMap.get(eu.userId) || 0,
          rank: 0, // Placeholder - this service is deprecated in favor of DashboardService
        }))
        .sort((a, b) => b.beerCount - a.beerCount);

      // Simple rank calculation (dense ranking)
      let currentRank = 1;
      users.forEach((user, index) => {
        if (index > 0 && users[index - 1].beerCount === user.beerCount) {
          user.rank = users[index - 1].rank;
        } else {
          user.rank = currentRank;
          currentRank += 1;
        }
      });

      return {
        males: users
          .filter((u) => u.gender === 'MALE')
          .map(({ rank, ...user }) => ({ ...user, rank })),
        females: users
          .filter((u) => u.gender === 'FEMALE')
          .map(({ rank, ...user }) => ({ ...user, rank })),
      };
    }

    // Get global leaderboard if no event is specified
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        username: true,
        gender: true,
        beerCount: true,
      },
      orderBy: { beerCount: 'desc' },
    });

    const usersWithBeerCount = users
      .map((u) => ({
        id: u.id,
        username: u.username || '',
        gender: u.gender,
        beerCount: u.beerCount || 0,
        rank: 0,
      }))
      .sort((a, b) => b.beerCount - a.beerCount);

    // Simple rank calculation (dense ranking)
    let currentRank = 1;
    usersWithBeerCount.forEach((user, index) => {
      if (
        index > 0 &&
        usersWithBeerCount[index - 1].beerCount === user.beerCount
      ) {
        user.rank = usersWithBeerCount[index - 1].rank;
      } else {
        user.rank = currentRank;
        currentRank += 1;
      }
    });

    return {
      males: usersWithBeerCount.filter((u) => u.gender === 'MALE'),
      females: usersWithBeerCount.filter((u) => u.gender === 'FEMALE'),
    };
  }
}
