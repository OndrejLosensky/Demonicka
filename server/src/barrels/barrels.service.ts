import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { Barrel } from './entities/barrel.entity';
import { CreateBarrelDto } from './dto/create-barrel.dto';
import { UpdateBarrelDto } from './dto/update-barrel.dto';

@Injectable()
export class BarrelsService {
  constructor(
    @InjectRepository(Barrel)
    private barrelsRepository: Repository<Barrel>,
  ) {}

  async cleanup(): Promise<void> {
    // First deactivate all barrels
    await this.barrelsRepository.update({}, { isActive: false });

    // Then soft delete all barrels
    const barrels = await this.barrelsRepository.find();
    for (const barrel of barrels) {
      await this.barrelsRepository.softRemove(barrel);
    }
  }

  async create(createBarrelDto: CreateBarrelDto): Promise<Barrel> {
    // Deactivate all existing non-deleted barrels
    await this.barrelsRepository.update(
      { deletedAt: IsNull() },
      { isActive: false },
    );

    // Create new barrel (active by default)
    const barrel = this.barrelsRepository.create({
      ...createBarrelDto,
      remainingBeers: createBarrelDto.size * 2,
      isActive: true,
    });
    return this.barrelsRepository.save(barrel);
  }

  async findAll(withDeleted = false): Promise<Barrel[]> {
    return this.barrelsRepository.find({
      withDeleted,
      order: { orderNumber: 'ASC' },
    });
  }

  async findDeleted(): Promise<Barrel[]> {
    return this.barrelsRepository.find({
      withDeleted: true,
      where: {
        deletedAt: Not(IsNull()),
      },
    });
  }

  async findOne(id: string, withDeleted = false): Promise<Barrel> {
    const barrel = await this.barrelsRepository.findOne({
      where: { id },
      withDeleted,
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

  async toggleActive(id: string): Promise<Barrel> {
    const barrel = await this.findOne(id);
    barrel.isActive = !barrel.isActive;
    return this.barrelsRepository.save(barrel);
  }

  async remove(id: string): Promise<void> {
    const barrel = await this.findOne(id);
    await this.barrelsRepository.softRemove(barrel);
  }

  async getActiveBarrel(): Promise<Barrel | null> {
    return this.barrelsRepository.findOne({
      where: { isActive: true },
      order: { createdAt: 'ASC' },
    });
  }

  async decrementBeers(id: string): Promise<void> {
    const barrel = await this.findOne(id);
    if (!barrel) {
      return;
    }

    // If no beers remaining, deactivate the barrel
    if (barrel.remainingBeers <= 1) {
      await this.barrelsRepository.update(id, {
        remainingBeers: 0,
        isActive: false,
      });
    } else {
      await this.barrelsRepository.update(id, {
        remainingBeers: barrel.remainingBeers - 1,
      });
    }
  }
}
