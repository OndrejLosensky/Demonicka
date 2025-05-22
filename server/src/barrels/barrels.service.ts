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

  async cleanup(): Promise<void> {
    // Get all barrels first
    const barrels = await this.barrelsRepository.find();
    
    // Remove them one by one to properly handle cascading
    for (const barrel of barrels) {
      await this.barrelsRepository.remove(barrel);
    }
  }

  async create(createBarrelDto: CreateBarrelDto): Promise<Barrel> {
    // Check if there are any existing barrels
    const existingBarrels = await this.barrelsRepository.find();
    const isFirstBarrel = existingBarrels.length === 0;

    // Only deactivate other barrels if this is not the first one
    if (!isFirstBarrel) {
      await this.barrelsRepository.update(
        { isActive: true },
        { isActive: false, remainingBeers: 0 },
      );
    }

    // Get the highest order number
    const lastBarrel = await this.barrelsRepository.findOne({
      where: {},
      order: { orderNumber: 'DESC' },
    });

    const newOrderNumber = lastBarrel ? lastBarrel.orderNumber + 1 : 1;

    // Create new barrel with calculated values
    const barrel = this.barrelsRepository.create({
      ...createBarrelDto,
      isActive: true, // Always set to active for first barrel or when explicitly activating
      orderNumber: newOrderNumber,
      remainingBeers: createBarrelDto.size * 2, // Each size unit equals 2 beers
    });

    return this.barrelsRepository.save(barrel);
  }

  async findAll(): Promise<Barrel[]> {
    return this.barrelsRepository.find({
      order: { orderNumber: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Barrel> {
    const barrel = await this.barrelsRepository.findOneBy({ id });

    if (!barrel) {
      throw new NotFoundException(`Barrel with ID ${id} not found`);
    }

    return barrel;
  }

  async update(id: string, updateBarrelDto: UpdateBarrelDto): Promise<Barrel> {
    // If we're activating this barrel, deactivate all others
    if (updateBarrelDto.isActive) {
      await this.barrelsRepository.update(
        { isActive: true },
        { isActive: false },
      );
    }

    await this.barrelsRepository.update(id, updateBarrelDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const barrel = await this.findOne(id);
    if (!barrel) {
      return;
    }
    await this.barrelsRepository.remove(barrel);
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
