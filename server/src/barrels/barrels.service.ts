import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Barrel } from './entities/barrel.entity';
import { CreateBarrelDto } from './dto/create-barrel.dto';
import { UpdateBarrelDto } from './dto/update-barrel.dto';

@Injectable()
export class BarrelsService {
  constructor(
    @InjectRepository(Barrel)
    private barrelsRepository: Repository<Barrel>,
  ) {}

  async create(createBarrelDto: CreateBarrelDto): Promise<Barrel> {
    const barrel = this.barrelsRepository.create(createBarrelDto);
    return this.barrelsRepository.save(barrel);
  }

  async findAll(): Promise<Barrel[]> {
    return this.barrelsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Barrel> {
    const barrel = await this.barrelsRepository.findOne({
      where: { id },
    });

    if (!barrel) {
      throw new NotFoundException(`Barrel with ID ${id} not found`);
    }

    return barrel;
  }

  async update(id: string, updateBarrelDto: UpdateBarrelDto): Promise<Barrel> {
    const barrel = await this.findOne(id);
    Object.assign(barrel, updateBarrelDto);
    return this.barrelsRepository.save(barrel);
  }

  async remove(id: string): Promise<void> {
    const result = await this.barrelsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Barrel with ID ${id} not found`);
    }
  }
}
