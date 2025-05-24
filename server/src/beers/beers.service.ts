import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Beer } from './entities/beer.entity';
import { ParticipantsService } from '../participants/participants.service';
import { BarrelsService } from '../barrels/barrels.service';
import { LoggingService } from '../logging/logging.service';

@Injectable()
export class BeersService {
  constructor(
    @InjectRepository(Beer)
    private beersRepository: Repository<Beer>,
    private participantsService: ParticipantsService,
    private barrelsService: BarrelsService,
    private loggingService: LoggingService,
  ) {}

  async addBeer(participantId: string): Promise<Beer> {
    const participant = await this.participantsService.findOne(participantId);
    if (!participant) {
      this.loggingService.error(
        'Nepodařilo se přidat pivo - účastník nenalezen',
        {
          participantId,
        },
      );
      throw new NotFoundException(
        `Účastník s ID ${participantId} nebyl nalezen`,
      );
    }

    // Find the oldest active barrel with remaining beers
    const activeBarrels = await this.barrelsService.findAll();
    const availableBarrel = activeBarrels
      .filter((barrel) => barrel.isActive && barrel.remainingBeers > 0)
      .sort((a, b) => a.orderNumber - b.orderNumber)[0];

    // Create the beer record
    const beer = this.beersRepository.create({
      participantId,
      participant,
      // Only set barrel info if there is an available barrel
      ...(availableBarrel && {
        barrelId: availableBarrel.id,
        barrel: availableBarrel,
      }),
    });

    // Update participant's lastBeerTime and beerCount
    await this.participantsService.update(participantId, {
      lastBeerTime: new Date(),
      beerCount: participant.beerCount + 1,
    });

    // If there is an available barrel, decrement its remaining beers
    if (availableBarrel) {
      await this.barrelsService.decrementBeers(availableBarrel.id);
    }

    const savedBeer = await this.beersRepository.save(beer);
    this.loggingService.logBeerAdded(participantId, availableBarrel?.id);
    return savedBeer;
  }

  async removeLastBeer(participantId: string): Promise<void> {
    const lastBeer = await this.beersRepository.findOne({
      where: { participantId },
      order: { createdAt: 'DESC' },
      relations: ['barrel'],
    });

    if (!lastBeer) {
      this.loggingService.error(
        'Nepodařilo se odebrat pivo - žádná piva nenalezena',
        {
          participantId,
        },
      );
      throw new NotFoundException(
        `Pro účastníka ${participantId} nebyla nalezena žádná piva`,
      );
    }

    const participant = await this.participantsService.findOne(participantId);
    if (participant) {
      await this.participantsService.update(participantId, {
        beerCount: Math.max(0, participant.beerCount - 1),
      });
    }

    // Increment the barrel's remaining beers if the beer was associated with a barrel
    if (lastBeer.barrelId && lastBeer.barrel) {
      await this.barrelsService.update(lastBeer.barrelId, {
        remainingBeers: lastBeer.barrel.remainingBeers + 1,
      });
    }

    await this.beersRepository.remove(lastBeer);
    this.loggingService.logBeerRemoved(participantId, lastBeer.barrelId);
  }

  async getParticipantBeers(participantId: string): Promise<Beer[]> {
    return this.beersRepository.find({
      where: { participantId },
      order: { createdAt: 'DESC' },
      relations: ['participant', 'barrel'],
    });
  }

  async getBeerCount(participantId: string): Promise<number> {
    return this.beersRepository.count({
      where: { participantId },
    });
  }
}
