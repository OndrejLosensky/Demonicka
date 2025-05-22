import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Participant } from '../participants/entities/participant.entity';
import { Beer } from '../beers/entities/beer.entity';
import { Barrel } from '../barrels/entities/barrel.entity';
import {
  DashboardResponseDto,
  ParticipantStatsDto,
  BarrelStatsDto,
} from './dto/dashboard.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Participant)
    private participantRepository: Repository<Participant>,
    @InjectRepository(Beer)
    private beerRepository: Repository<Beer>,
    @InjectRepository(Barrel)
    private barrelRepository: Repository<Barrel>,
  ) {}

  async getDashboardStats(): Promise<DashboardResponseDto> {
    // Get total counts
    const totalParticipants = await this.participantRepository.count();
    const totalBeers = await this.beerRepository.count();
    const totalBarrels = await this.barrelRepository.count();

    // Calculate average beers per participant
    const averageBeersPerParticipant = totalParticipants
      ? totalBeers / totalParticipants
      : 0;

    // Get top participants with their beer counts
    const participantsWithBeerCounts = await this.participantRepository
      .createQueryBuilder('participant')
      .leftJoin('participant.beers', 'beer')
      .select([
        'participant.id as id',
        'participant.name as name',
        'COUNT(beer.id) as beerCount',
      ])
      .groupBy('participant.id')
      .orderBy('beerCount', 'DESC')
      .getRawMany<{ id: number; name: string; beerCount: string }>();

    const topParticipants: ParticipantStatsDto[] =
      participantsWithBeerCounts.map((p) => ({
        id: p.id,
        name: p.name,
        beerCount: parseInt(p.beerCount),
      }));

    // Get barrel statistics
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
      totalParticipants,
      totalBarrels,
      averageBeersPerParticipant,
      topParticipants,
      barrelStats: formattedBarrelStats,
    };
  }
}
