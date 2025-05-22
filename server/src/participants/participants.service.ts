import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Participant } from './entities/participant.entity';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { UpdateParticipantDto } from './dto/update-participant.dto';

@Injectable()
export class ParticipantsService {
  constructor(
    @InjectRepository(Participant)
    private participantsRepository: Repository<Participant>,
  ) {}

  async create(
    createParticipantDto: CreateParticipantDto,
  ): Promise<Participant> {
    const existingParticipant = await this.participantsRepository.findOne({
      where: { name: createParticipantDto.name },
    });

    if (existingParticipant) {
      throw new ConflictException('Participant with this name already exists');
    }

    const participant =
      this.participantsRepository.create(createParticipantDto);
    return this.participantsRepository.save(participant);
  }

  findAll(): Promise<Participant[]> {
    return this.participantsRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Participant> {
    const participant = await this.participantsRepository.findOne({
      where: { id },
    });

    if (!participant) {
      throw new NotFoundException(`Participant with ID ${id} not found`);
    }

    return participant;
  }

  async update(
    id: number,
    updateParticipantDto: UpdateParticipantDto,
  ): Promise<Participant> {
    const participant = await this.findOne(id);

    if (updateParticipantDto.name) {
      const where: FindOptionsWhere<Participant> = {
        name: updateParticipantDto.name,
      };
      const existingParticipant =
        await this.participantsRepository.findOneBy(where);

      if (existingParticipant && existingParticipant.id !== id) {
        throw new ConflictException(
          'Participant with this name already exists',
        );
      }
    }

    Object.assign(participant, updateParticipantDto);
    return this.participantsRepository.save(participant);
  }

  async remove(id: number): Promise<void> {
    const participant = await this.findOne(id);
    await this.participantsRepository.remove(participant);
  }
}
