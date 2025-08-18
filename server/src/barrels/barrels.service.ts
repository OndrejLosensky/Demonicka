import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Barrel } from './entities/barrel.entity';
import { CreateBarrelDto } from './dto/create-barrel.dto';
import { UpdateBarrelDto } from './dto/update-barrel.dto';
import { LoggingService } from '../logging/logging.service';
import { LeaderboardGateway } from '../leaderboard/leaderboard.gateway';

@Injectable()
export class BarrelsService {
  constructor(
    @InjectRepository(Barrel)
    private barrelsRepository: Repository<Barrel>,
    private loggingService: LoggingService,
    private readonly leaderboardGateway: LeaderboardGateway,
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
      
      // Emit live updates for dashboard
      await this.leaderboardGateway.emitDashboardUpdate();
      
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
      
      // Emit live updates for dashboard
      await this.leaderboardGateway.emitDashboardUpdate();
      
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
      
      // Emit live updates for dashboard
      await this.leaderboardGateway.emitDashboardUpdate();
      
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
