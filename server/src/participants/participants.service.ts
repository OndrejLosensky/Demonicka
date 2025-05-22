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

@Injectable()
export class ParticipantsService {
  constructor(
    @InjectRepository(Participant)
    private participantsRepository: Repository<Participant>,
    @InjectRepository(Beer)
    private beersRepository: Repository<Beer>,
    @InjectRepository(Barrel)
    private barrelsRepository: Repository<Barrel>,
  ) {}

  async cleanup(): Promise<void> {
    // First, delete all beers using a query builder
    await this.beersRepository.createQueryBuilder().delete().execute();
    
    // Reset all barrels' remaining beers count
    const barrels = await this.barrelsRepository.find();
    for (const barrel of barrels) {
      barrel.remainingBeers = barrel.size * 2;
      await this.barrelsRepository.save(barrel);
    }
    
    // Then get all participants
    const participants = await this.participantsRepository.find();
    
    // Remove them one by one
    for (const participant of participants) {
      await this.participantsRepository.remove(participant);
    }
  }

  async create(createParticipantDto: CreateParticipantDto): Promise<Participant> {
    const existingParticipant = await this.participantsRepository.findOne({
      where: { name: createParticipantDto.name },
    });

    if (existingParticipant) {
      throw new ConflictException('Participant with this name already exists');
    }

    const participant = this.participantsRepository.create(createParticipantDto);
    return this.participantsRepository.save(participant);
  }

  async findAll(): Promise<Participant[]> {
    return this.participantsRepository.find({
      order: { beerCount: 'DESC', name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Participant> {
    const participant = await this.participantsRepository.findOne({
      where: { id },
    });

    if (!participant) {
      throw new NotFoundException(`Participant with ID ${id} not found`);
    }

    return participant;
  }

  async update(
    id: string,
    updateParticipantDto: UpdateParticipantDto,
  ): Promise<Participant> {
    const participant = await this.findOne(id);

    if (updateParticipantDto.name) {
      const existingParticipant = await this.participantsRepository.findOne({
        where: { name: updateParticipantDto.name },
      });

      if (existingParticipant && existingParticipant.id !== id) {
        throw new ConflictException('Participant with this name already exists');
      }
    }

    Object.assign(participant, updateParticipantDto);
    return this.participantsRepository.save(participant);
  }

  async remove(id: string): Promise<void> {
    const participant = await this.findOne(id);
    await this.participantsRepository.remove(participant);
  }
}
