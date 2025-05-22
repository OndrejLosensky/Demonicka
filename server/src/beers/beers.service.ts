import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Beer } from './entities/beer.entity';
import { ParticipantsService } from '../participants/participants.service';

@Injectable()
export class BeersService {
  constructor(
    @InjectRepository(Beer)
    private beersRepository: Repository<Beer>,
    private participantsService: ParticipantsService,
  ) {}

  async addBeer(participantId: string): Promise<Beer> {
    const participant = await this.participantsService.findOne(participantId);
    if (!participant) {
      throw new NotFoundException(
        `Participant with ID ${participantId} not found`,
      );
    }

    const beer = this.beersRepository.create({
      participantId,
      participant,
    });

    // Update participant's lastBeerTime and beerCount
    await this.participantsService.update(participantId, {
      lastBeerTime: new Date(),
      beerCount: participant.beerCount + 1,
    });

    return this.beersRepository.save(beer);
  }

  async removeLastBeer(participantId: string): Promise<void> {
    const lastBeer = await this.beersRepository.findOne({
      where: { participantId },
      order: { createdAt: 'DESC' },
    });

    if (!lastBeer) {
      throw new NotFoundException(
        `No beers found for participant ${participantId}`,
      );
    }

    const participant = await this.participantsService.findOne(participantId);
    if (participant) {
      await this.participantsService.update(participantId, {
        beerCount: Math.max(0, participant.beerCount - 1),
      });
    }

    await this.beersRepository.remove(lastBeer);
  }

  async getParticipantBeers(participantId: string): Promise<Beer[]> {
    return this.beersRepository.find({
      where: { participantId },
      order: { createdAt: 'DESC' },
      relations: ['participant'],
    });
  }

  async getBeerCount(participantId: string): Promise<number> {
    return this.beersRepository.count({
      where: { participantId },
    });
  }
} 