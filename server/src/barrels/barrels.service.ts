import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
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

  async cleanup(): Promise<void> {
    // First deactivate all barrels
    await this.barrelsRepository.update({}, { isActive: false });

    // Then soft delete all barrels
    const barrels = await this.barrelsRepository.find();
    for (const barrel of barrels) {
      await this.barrelsRepository.softRemove(barrel);
    }

    this.loggingService.logCleanup('BARRELS');
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
      this.loggingService.error('Barrel not found', { id });
      throw new NotFoundException(`Barrel with ID ${id} not found`);
    }

    return barrel;
  }

  async update(id: string, updateBarrelDto: UpdateBarrelDto): Promise<Barrel> {
    try {
      const barrel = await this.findOne(id);
      Object.assign(barrel, updateBarrelDto);
      const savedBarrel = await this.barrelsRepository.save(barrel);
      this.loggingService.info('Barrel updated', {
        id,
        changes: updateBarrelDto,
      });
      return savedBarrel;
    } catch (error: unknown) {
      this.loggingService.error('Failed to update barrel', {
        id,
        error: error instanceof Error ? error.message : String(error),
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
      this.loggingService.info('Barrel active status toggled', {
        id,
        isActive: savedBarrel.isActive,
      });
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

  async getActiveBarrel(): Promise<Barrel | null> {
    return this.barrelsRepository.findOne({
      where: { isActive: true },
      order: { createdAt: 'ASC' },
    });
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
        this.loggingService.info('Barrel deactivated - no beers remaining', {
          id,
        });
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
