import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Beer } from './entities/beer.entity';
import { User } from '../users/entities/user.entity';
import { Barrel } from '../barrels/entities/barrel.entity';

@Injectable()
export class BeersService {
  private readonly logger = new Logger(BeersService.name);

  constructor(
    @InjectRepository(Beer)
    private readonly beerRepository: Repository<Beer>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Barrel)
    private readonly barrelRepository: Repository<Barrel>,
  ) {}

  async create(userId: string, barrelId?: string): Promise<Beer> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    let barrel: Barrel | null = null;
    if (barrelId) {
      barrel = await this.barrelRepository.findOne({
        where: { id: barrelId },
      });

      if (!barrel) {
        throw new Error('Barrel not found');
      }
    }

    const beer = this.beerRepository.create({
      userId,
      barrelId: barrel?.id || null,
    });

    const savedBeer = await this.beerRepository.save(beer);

    // Update user's beer count and last beer time
    user.beerCount = (user.beerCount || 0) + 1;
    user.lastBeerTime = new Date();
    await this.userRepository.save(user);

    return savedBeer;
  }

  async findByUserId(userId: string): Promise<Beer[]> {
    return this.beerRepository.find({
      where: { userId },
      relations: ['barrel'],
    });
  }

  async findAll(): Promise<Beer[]> {
    return this.beerRepository.find({
      relations: ['user', 'barrel'],
    });
  }

  async findOne(id: string): Promise<Beer | null> {
    return this.beerRepository.findOne({
      where: { id },
      relations: ['user', 'barrel'],
    });
  }

  async getUserBeerCount(userId: string): Promise<number> {
    const beers = await this.beerRepository.find({
      where: { userId },
    });
    return beers.length;
  }

  async getLastBeerTime(userId: string): Promise<Date | null> {
    const lastBeer = await this.beerRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return lastBeer?.createdAt || null;
  }
}
