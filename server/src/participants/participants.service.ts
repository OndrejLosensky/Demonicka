import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { UpdateParticipantDto } from './dto/update-participant.dto';
import { Participant } from './entities/participant.entity';
import { Beer } from '../beers/entities/beer.entity';
import { Barrel } from '../barrels/entities/barrel.entity';
import { Not, IsNull } from 'typeorm';
import { LoggingService } from '../logging/logging.service';

@Injectable()
export class ParticipantsService {
  constructor(
    @InjectRepository(Participant)
    private participantsRepository: Repository<Participant>,
    @InjectRepository(Beer)
    private beersRepository: Repository<Beer>,
    @InjectRepository(Barrel)
    private barrelsRepository: Repository<Barrel>,
    private loggingService: LoggingService,
  ) {}

  async cleanup(): Promise<void> {
    try {
      // Soft delete all beers
      await this.beersRepository.createQueryBuilder().softDelete().execute();

      // Reset all barrels' remaining beers count
      const barrels = await this.barrelsRepository.find();
      for (const barrel of barrels) {
        barrel.remainingBeers = barrel.size * 2;
        await this.barrelsRepository.save(barrel);
      }

      // Soft delete all participants
      const participants = await this.participantsRepository.find();
      for (const participant of participants) {
        await this.participantsRepository.softRemove(participant);
      }

      this.loggingService.logCleanup('PARTICIPANTS', {
        participantsDeleted: participants.length,
        barrelsReset: barrels.length,
      });
    } catch (error: unknown) {
      this.loggingService.error('Failed to cleanup participants', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async create(
    createParticipantDto: CreateParticipantDto,
  ): Promise<Participant> {
    try {
      const existingParticipant = await this.participantsRepository.findOne({
        where: {
          name: createParticipantDto.name,
          deletedAt: IsNull(),
        },
      });

      if (existingParticipant) {
        this.loggingService.warn('Attempted to create duplicate participant', {
          name: createParticipantDto.name,
        });
        throw new ConflictException(
          'Participant with this name already exists',
        );
      }

      const participant = this.participantsRepository.create(createParticipantDto);

      const savedParticipant = await this.participantsRepository.save(participant);

      this.loggingService.logParticipantCreated(
        savedParticipant.id,
        savedParticipant.name,
        savedParticipant.gender,
      );

      return savedParticipant;
    } catch (error: unknown) {
      if (!(error instanceof ConflictException)) {
        this.loggingService.error('Failed to create participant', {
          error: error instanceof Error ? error.message : String(error),
          participant: createParticipantDto,
        });
      }
      throw error;
    }
  }

  async findAll(withDeleted = false): Promise<Participant[]> {
    try {
      return this.participantsRepository.find({
        order: { beerCount: 'DESC', name: 'ASC' },
        withDeleted,
      });
    } catch (error: unknown) {
      this.loggingService.error('Failed to fetch participants', {
        error: error instanceof Error ? error.message : String(error),
        withDeleted,
      });
      throw error;
    }
  }

  async findOne(id: string, withDeleted = false): Promise<Participant> {
    try {
      const participant = await this.participantsRepository.findOne({
        where: { id },
        withDeleted,
      });

      if (!participant) {
        this.loggingService.warn('Participant not found', { id, withDeleted });
        throw new NotFoundException(`Participant with ID ${id} not found`);
      }

      return participant;
    } catch (error: unknown) {
      if (!(error instanceof NotFoundException)) {
        this.loggingService.error('Failed to fetch participant', {
          error: error instanceof Error ? error.message : String(error),
          id,
          withDeleted,
        });
      }
      throw error;
    }
  }

  async update(
    id: string,
    updateParticipantDto: UpdateParticipantDto,
  ): Promise<Participant> {
    try {
      const participant = await this.findOne(id);
      const oldBeerCount = participant.beerCount;

      if (updateParticipantDto.name) {
        const existingParticipant = await this.participantsRepository.findOne({
          where: { name: updateParticipantDto.name },
          withDeleted: false,
        });

        if (existingParticipant && existingParticipant.id !== id) {
          this.loggingService.warn('Attempted to update to existing name', {
            id,
            newName: updateParticipantDto.name,
            existingId: existingParticipant.id,
          });
          throw new ConflictException(
            'Participant with this name already exists',
          );
        }
      }

      Object.assign(participant, updateParticipantDto);

      const savedParticipant = await this.participantsRepository.save(participant);

      this.loggingService.logParticipantUpdated(id, updateParticipantDto);

      // Log beer count changes separately
      if (
        updateParticipantDto.beerCount !== undefined &&
        updateParticipantDto.beerCount !== oldBeerCount
      ) {
        this.loggingService.logParticipantBeerCountUpdated(
          id,
          oldBeerCount,
          updateParticipantDto.beerCount,
        );
      }

      return savedParticipant;
    } catch (error: unknown) {
      if (!(error instanceof ConflictException)) {
        this.loggingService.error('Failed to update participant', {
          error: error instanceof Error ? error.message : String(error),
          id,
          changes: updateParticipantDto,
        });
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const participant = await this.findOne(id);
      await this.participantsRepository.softRemove(participant);
      this.loggingService.logParticipantDeleted(id);
    } catch (error: unknown) {
      if (!(error instanceof NotFoundException)) {
        this.loggingService.error('Failed to delete participant', {
          error: error instanceof Error ? error.message : String(error),
          id,
        });
      }
      throw error;
    }
  }

  async findDeleted(): Promise<Participant[]> {
    try {
      return this.participantsRepository.find({
        withDeleted: true,
        where: {
          deletedAt: Not(IsNull()),
        },
      });
    } catch (error: unknown) {
      this.loggingService.error('Failed to fetch deleted participants', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
