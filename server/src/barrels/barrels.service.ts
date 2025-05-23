import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Barrel } from './entities/barrel.entity';
import { CreateBarrelDto } from './dto/create-barrel.dto';
import { UpdateBarrelDto } from './dto/update-barrel.dto';
import { LoggingService } from '../logging/logging.service';

@Injectable()
export class BarrelsService {
  constructor(
    @InjectRepository(Barrel)
    private barrelsRepository: Repository<Barrel>,
    private loggingService: LoggingService,
  ) {}

  async findAll(withDeleted = false): Promise<Barrel[]> {
    return this.barrelsRepository.find({
      where: withDeleted ? {} : { deletedAt: IsNull() },
      order: { orderNumber: 'ASC' },
    });
  }

  async findDeleted(): Promise<Barrel[]> {
    return this.barrelsRepository.find({
      withDeleted: true,
      where: {
        deletedAt: IsNull(),
      },
    });
  }

  async getActiveBarrel(): Promise<Barrel | null> {
    return this.barrelsRepository.findOne({
      where: { isActive: true },
      order: { createdAt: 'ASC' },
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

  async create(createBarrelDto: CreateBarrelDto): Promise<Barrel> {
    try {
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
      const savedBarrel = await this.barrelsRepository.save(barrel);
      this.loggingService.logBarrelCreated(savedBarrel.id, savedBarrel.size);
      return savedBarrel;
    } catch (error: unknown) {
      this.loggingService.error('Failed to create barrel', {
        error: error instanceof Error ? error.message : String(error),
        size: createBarrelDto.size,
      });
      throw error;
    }
  }

  async update(id: string, updateBarrelDto: UpdateBarrelDto): Promise<Barrel> {
    try {
      const barrel = await this.findOne(id);
      Object.assign(barrel, updateBarrelDto);
      const savedBarrel = await this.barrelsRepository.save(barrel);
      this.loggingService.logBarrelUpdated(id, updateBarrelDto);
      return savedBarrel;
    } catch (error: unknown) {
      this.loggingService.error('Failed to update barrel', {
        error: error instanceof Error ? error.message : String(error),
        id,
        changes: updateBarrelDto,
      });
      throw error;
    }
  }

  async toggleActive(id: string): Promise<Barrel> {
    try {
      const barrel = await this.findOne(id);
      barrel.isActive = !barrel.isActive;
      const savedBarrel = await this.barrelsRepository.save(barrel);
      this.loggingService.logBarrelStatusChanged(id, savedBarrel.isActive);
      return savedBarrel;
    } catch (error: unknown) {
      this.loggingService.error('Failed to toggle barrel active status', {
        id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const barrel = await this.findOne(id);
      await this.barrelsRepository.softRemove(barrel);
      this.loggingService.logBarrelDeleted(id);
    } catch (error: unknown) {
      this.loggingService.error('Failed to delete barrel', {
        id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    try {
      const barrels = await this.findAll(true);
      const count = barrels.length;
      for (const barrel of barrels) {
        await this.barrelsRepository.softRemove(barrel);
      }
      this.loggingService.logCleanup('BARRELS', { barrelsDeleted: count });
    } catch (error: unknown) {
      this.loggingService.error('Failed to cleanup barrels', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async decrementBeers(id: string): Promise<void> {
    try {
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
        this.loggingService.logBarrelEmpty(id);
        this.loggingService.logBarrelStatusChanged(id, false);
      } else {
        await this.barrelsRepository.update(id, {
          remainingBeers: barrel.remainingBeers - 1,
        });
        this.loggingService.debug('Barrel beers decremented', {
          id,
          remainingBeers: barrel.remainingBeers - 1,
        });
      }
    } catch (error: unknown) {
      this.loggingService.error('Failed to decrement barrel beers', {
        id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
