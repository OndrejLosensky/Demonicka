import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async getLeaderboard() {
    const users = await this.usersRepository.find({
      where: {
        isRegistrationComplete: true,
      },
      order: {
        beerCount: 'DESC',
      },
      take: 10,
    });

    return users.map(user => ({
      id: user.id,
      username: user.username,
      name: user.name,
      beerCount: user.beerCount,
      lastBeerTime: user.lastBeerTime,
    }));
  }
} 