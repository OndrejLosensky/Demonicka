import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { EventBeer } from '../events/entities/event-beer.entity';
import { LeaderboardEntryDto } from './dto/leaderboard.dto';

interface RawEventBeerStats {
  id: string;
  username: string;
  name: string | null;
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

  async getLeaderboard(eventId?: string): Promise<LeaderboardEntryDto[]> {
    if (eventId) {
      // Get event-specific leaderboard using event beers
      const eventBeers = await this.eventBeerRepository
        .createQueryBuilder('eventBeer')
        .leftJoinAndSelect('eventBeer.user', 'user')
        .where('eventBeer.eventId = :eventId', { eventId })
        .andWhere('user.isRegistrationComplete = :isComplete', {
          isComplete: true,
        })
        .select([
          'user.id as id',
          'user.username as username',
          'user.name as name',
          'COUNT(eventBeer.id) as beerCount',
          'MAX(eventBeer.consumedAt) as lastBeerTime',
        ])
        .groupBy('user.id')
        .orderBy('beerCount', 'DESC')
        .limit(10)
        .getRawMany<RawEventBeerStats>();

      return eventBeers.map((beer) => ({
        id: beer.id,
        username: beer.username,
        name: beer.name,
        beerCount: parseInt(beer.beerCount, 10),
        lastBeerTime: beer.lastBeerTime,
      }));
    }

    // Get global leaderboard if no event is specified
    const users = await this.usersRepository.find({
      where: {
        isRegistrationComplete: true,
      },
      order: {
        beerCount: 'DESC',
      },
      take: 10,
    });

    return users.map((user) => ({
      id: user.id,
      username: user.username,
      name: user.name,
      beerCount: user.beerCount,
      lastBeerTime: user.lastBeerTime,
    }));
  }
} 