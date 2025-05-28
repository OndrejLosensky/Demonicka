import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Participant } from '../participants/entities/participant.entity';
import { Beer } from '../beers/entities/beer.entity';
import { Barrel } from '../barrels/entities/barrel.entity';
import { Event } from '../events/entities/event.entity';
import {
  DashboardResponseDto,
  ParticipantStatsDto,
  BarrelStatsDto,
} from './dto/dashboard.dto';
import {
  LeaderboardDto,
  ParticipantLeaderboardDto,
} from './dto/leaderboard.dto';
import { PublicStatsDto } from './dto/public-stats.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Participant)
    private participantRepository: Repository<Participant>,
    @InjectRepository(Beer)
    private beerRepository: Repository<Beer>,
    @InjectRepository(Barrel)
    private barrelRepository: Repository<Barrel>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
  ) {}

  async getPublicStats(eventId?: string): Promise<PublicStatsDto> {
    let event: Event | null = null;
    
    if (eventId) {
      event = await this.eventRepository.findOne({
        where: { id: eventId },
        relations: ['participants', 'barrels']
      });
      
      if (!event) {
        throw new Error('Event not found');
      }
    }

    if (event) {
      // Event-specific stats
      const eventParticipantIds = event.participants.map(p => p.id);
      const eventBarrelIds = event.barrels.map(b => b.id);

      // Get beer count for event participants
      const totalBeers = eventParticipantIds.length > 0 
        ? await this.beerRepository
            .createQueryBuilder('beer')
            .where('beer.participantId IN (:...ids)', { ids: eventParticipantIds })
            .getCount()
        : 0;

      // Get top participants for this event
      const participantsWithBeerCounts = eventParticipantIds.length > 0
        ? await this.participantRepository
            .createQueryBuilder('participant')
            .leftJoin('participant.beers', 'beer')
            .select(['participant.name as name', 'COUNT(beer.id) as beerCount'])
            .where('participant.id IN (:...ids)', { ids: eventParticipantIds })
            .groupBy('participant.id')
            .orderBy('beerCount', 'DESC')
            .limit(6)
            .getRawMany<{ name: string; beerCount: string }>()
        : [];

      const topParticipants = participantsWithBeerCounts.map((p) => ({
        name: p.name,
        beerCount: parseInt(p.beerCount),
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
        totalParticipants: event.participants.length,
        totalBarrels: event.barrels.length,
        topParticipants,
        barrelStats: formattedBarrelStats,
      };
    } else {
      // Global stats (existing logic)
      const totalParticipants = await this.participantRepository.count();
      const totalBeers = await this.beerRepository.count();
      const totalBarrels = await this.barrelRepository.count();

      const participantsWithBeerCounts = await this.participantRepository
        .createQueryBuilder('participant')
        .leftJoin('participant.beers', 'beer')
        .select(['participant.name as name', 'COUNT(beer.id) as beerCount'])
        .groupBy('participant.id')
        .orderBy('beerCount', 'DESC')
        .limit(6)
        .getRawMany<{ name: string; beerCount: string }>();

      const topParticipants = participantsWithBeerCounts.map((p) => ({
        name: p.name,
        beerCount: parseInt(p.beerCount),
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
        totalParticipants,
        totalBarrels,
        topParticipants,
        barrelStats: formattedBarrelStats,
      };
    }
  }

  async getDashboardStats(eventId?: string): Promise<DashboardResponseDto> {
    let event: Event | null = null;
    
    if (eventId) {
      event = await this.eventRepository.findOne({
        where: { id: eventId },
        relations: ['participants', 'barrels']
      });
      
      if (!event) {
        throw new Error('Event not found');
      }
    }

    if (event) {
      // Event-specific stats
      const eventParticipantIds = event.participants.map(p => p.id);
      const eventBarrelIds = event.barrels.map(b => b.id);

      // Get beer count for event participants
      const totalBeers = eventParticipantIds.length > 0 
        ? await this.beerRepository
            .createQueryBuilder('beer')
            .where('beer.participantId IN (:...ids)', { ids: eventParticipantIds })
            .getCount()
        : 0;

      const totalParticipants = event.participants.length;
      const totalBarrels = event.barrels.length;
      const averageBeersPerParticipant = totalParticipants ? totalBeers / totalParticipants : 0;

      // Get top participants for this event
      const participantsWithBeerCounts = eventParticipantIds.length > 0
        ? await this.participantRepository
            .createQueryBuilder('participant')
            .leftJoin('participant.beers', 'beer')
            .select([
              'participant.id as id',
              'participant.name as name',
              'COUNT(beer.id) as beerCount',
            ])
            .where('participant.id IN (:...ids)', { ids: eventParticipantIds })
            .groupBy('participant.id')
            .orderBy('beerCount', 'DESC')
            .getRawMany<{ id: string; name: string; beerCount: string }>()
        : [];

      const topParticipants: ParticipantStatsDto[] = participantsWithBeerCounts.map((p) => ({
        id: p.id,
        name: p.name,
        beerCount: parseInt(p.beerCount),
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
        totalParticipants,
        totalBarrels,
        averageBeersPerParticipant,
        topParticipants,
        barrelStats: formattedBarrelStats,
      };
    } else {
      // Global stats (existing logic)
      const totalParticipants = await this.participantRepository.count();
      const totalBeers = await this.beerRepository.count();
      const totalBarrels = await this.barrelRepository.count();
      const averageBeersPerParticipant = totalParticipants ? totalBeers / totalParticipants : 0;

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
        .getRawMany<{ id: string; name: string; beerCount: string }>();

      const topParticipants: ParticipantStatsDto[] = participantsWithBeerCounts.map((p) => ({
        id: p.id,
        name: p.name,
        beerCount: parseInt(p.beerCount),
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
        totalParticipants,
        totalBarrels,
        averageBeersPerParticipant,
        topParticipants,
        barrelStats: formattedBarrelStats,
      };
    }
  }

  async getLeaderboard(eventId?: string): Promise<LeaderboardDto> {
    let event: Event | null = null;
    
    if (eventId) {
      event = await this.eventRepository.findOne({
        where: { id: eventId },
        relations: ['participants']
      });
      
      if (!event) {
        throw new Error('Event not found');
      }
    }

    if (event) {
      // Event-specific leaderboard
      const eventParticipantIds = event.participants.map(p => p.id);
      
      const participants = eventParticipantIds.length > 0
        ? await this.participantRepository
            .createQueryBuilder('participant')
            .leftJoin('participant.beers', 'beer')
            .select([
              'participant.id as id',
              'participant.name as name',
              'participant.gender as gender',
              'COUNT(beer.id) as beerCount',
            ])
            .where('participant.id IN (:...ids)', { ids: eventParticipantIds })
            .groupBy('participant.id')
            .orderBy('beerCount', 'DESC')
            .getRawMany<ParticipantLeaderboardDto>()
        : [];

      return {
        males: participants
          .filter((p) => p.gender === 'MALE')
          .map((p) => ({
            ...p,
            beerCount: parseInt(p.beerCount as unknown as string),
          })),
        females: participants
          .filter((p) => p.gender === 'FEMALE')
          .map((p) => ({
            ...p,
            beerCount: parseInt(p.beerCount as unknown as string),
          })),
      };
    } else {
      // Global leaderboard (existing logic)
      const participants = await this.participantRepository
        .createQueryBuilder('participant')
        .leftJoin('participant.beers', 'beer')
        .select([
          'participant.id as id',
          'participant.name as name',
          'participant.gender as gender',
          'COUNT(beer.id) as beerCount',
        ])
        .groupBy('participant.id')
        .orderBy('beerCount', 'DESC')
        .getRawMany<ParticipantLeaderboardDto>();

      return {
        males: participants
          .filter((p) => p.gender === 'MALE')
          .map((p) => ({
            ...p,
            beerCount: parseInt(p.beerCount as unknown as string),
          })),
        females: participants
          .filter((p) => p.gender === 'FEMALE')
          .map((p) => ({
            ...p,
            beerCount: parseInt(p.beerCount as unknown as string),
          })),
      };
    }
  }
}
