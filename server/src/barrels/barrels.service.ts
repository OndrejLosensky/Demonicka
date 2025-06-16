import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { Barrel } from './entities/barrel.entity';
import { CreateBarrelDto } from './dto/create-barrel.dto';
import { UpdateBarrelDto } from './dto/update-barrel.dto';
import { LoggingService } from '../logging/logging.service';
import { PaginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class BarrelsService {
  constructor(
    @InjectRepository(Barrel)
    private barrelsRepository: Repository<Barrel>,
    private loggingService: LoggingService,
  ) {}

  async findAll(
    withDeleted = false,
    take = 20,
    skip = 0,
  ): Promise<PaginatedResponse<Barrel>> {
    const [barrels, total] = await this.barrelsRepository.findAndCount({
      where: withDeleted ? {} : { deletedAt: IsNull() },
      order: { orderNumber: 'ASC' },
      take,
      skip,
    });

    const totalPages = Math.ceil(total / take);
    const page = Math.floor(skip / take) + 1;

    return {
      data: barrels,
      total,
      page,
      pageSize: take,
      totalPages,
    };
  }

  async findDeleted(take = 20, skip = 0): Promise<PaginatedResponse<Barrel>> {
    const [barrels, total] = await this.barrelsRepository.findAndCount({
      withDeleted: true,
      where: {
        deletedAt: Not(IsNull()),
      },
      take,
      skip,
    });

    const totalPages = Math.ceil(total / take);
    const page = Math.floor(skip / take) + 1;

    return {
      data: barrels,
      total,
      page,
      pageSize: take,
      totalPages,
    };
  }

  async getActiveBarrel(): Promise<Barrel | null> {
    return this.barrelsRepository.findOne({
      where: { isActive: true, deletedAt: IsNull() },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Barrel> {
    const barrel = await this.barrelsRepository.findOne({
      where: { id },
    });
    if (!barrel) {
      throw new NotFoundException(`Sud s ID ${id} nebyl nalezen`);
    }
    return barrel;
  }

  async create(createBarrelDto: CreateBarrelDto): Promise<Barrel> {
    try {
      // Create new barrel (inactive by default)
      const barrel = this.barrelsRepository.create({
        ...createBarrelDto,
        size: createBarrelDto.size as 15 | 30 | 50,
        isActive: false,
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

  async setActive(id: string): Promise<Barrel> {
    try {
      const barrel = await this.findOne(id);
      
      if (barrel.remainingBeers <= 0) {
        throw new BadRequestException('Nelze aktivovat prázdný sud');
      }

      // Deactivate current active barrel if exists
      const currentActive = await this.getActiveBarrel();
      if (currentActive && currentActive.id !== id) {
        currentActive.isActive = false;
        await this.barrelsRepository.save(currentActive);
      }

      // Activate the new barrel
      barrel.isActive = true;
      const savedBarrel = await this.barrelsRepository.save(barrel);
      this.loggingService.logBarrelStatusChanged(id, true);
      return savedBarrel;
    } catch (error: unknown) {
      this.loggingService.error('Failed to set barrel active status', {
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

  async cleanup(): Promise<{ deletedCount: number }> {
    const barrels = await this.findDeleted();
    const count = barrels.data.length;
    for (const barrel of barrels.data) {
      await this.barrelsRepository.remove(barrel);
    }
    return { deletedCount: count };
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
