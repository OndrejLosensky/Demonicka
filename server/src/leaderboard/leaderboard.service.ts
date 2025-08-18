import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { EventBeer } from '../events/entities/event-beer.entity';
import { LeaderboardDto, UserLeaderboardDto } from '../dashboard/dto/leaderboard.dto';

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
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(EventBeer)
    private eventBeerRepository: Repository<EventBeer>,
  ) {}

  async getLeaderboard(eventId?: string): Promise<LeaderboardDto> {
    if (eventId) {
      // Get all event participants with their event-specific beer counts
      // Use LEFT JOIN to ensure users with 0 beers are included
      const participants = await this.usersRepository
        .createQueryBuilder('user')
        .leftJoin('user.events', 'event', 'event.id = :eventId', { eventId })
        .leftJoin('user.eventBeers', 'eventBeer', 'eventBeer.eventId = :eventId', { eventId })
        .select([
          'user.id as id',
          'user.username as username',
          'user.gender as gender',
          'COALESCE(COUNT(DISTINCT eventBeer.id), 0) as beerCount'
        ])
        .where('event.id = :eventId', { eventId })
        .groupBy('user.id, user.username, user.gender')
        .orderBy('beerCount', 'DESC')
        .getRawMany();

      const users = participants.map(participant => ({
        ...participant,
        beerCount: parseInt(participant.beerCount, 10) || 0
      }));

      return {
        males: users.filter(u => u.gender === 'MALE'),
        females: users.filter(u => u.gender === 'FEMALE'),
      };
    }

    // Get global leaderboard if no event is specified
    const users = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoin('user.beers', 'beer')
      .select([
        'user.id as id',
        'user.username as username',
        'user.gender as gender',
        'COALESCE(COUNT(DISTINCT beer.id), 0) as beerCount',
      ])
      .groupBy('user.id, user.username, user.gender')
      .orderBy('beerCount', 'DESC')
      .getRawMany<UserLeaderboardDto>();

    return {
      males: users.map(u => ({
        ...u,
        beerCount: parseInt(u.beerCount as unknown as string) || 0
      })).filter(u => u.gender === 'MALE'),
      females: users.map(u => ({
        ...u,
        beerCount: parseInt(u.beerCount as unknown as string) || 0
      })).filter(u => u.gender === 'FEMALE'),
    };
  }
} 