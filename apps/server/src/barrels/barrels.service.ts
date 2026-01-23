import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { Barrel } from '@prisma/client';
import { CreateBarrelDto } from './dto/create-barrel.dto';
import { UpdateBarrelDto } from './dto/update-barrel.dto';
import { LoggingService } from '../logging/logging.service';
import { LeaderboardGateway } from '../leaderboard/leaderboard.gateway';

@Injectable()
export class BarrelsService {
  constructor(
    private prisma: PrismaService,
    private loggingService: LoggingService,
    private readonly leaderboardGateway: LeaderboardGateway,
  ) {}

  async findAll(withDeleted = false): Promise<Barrel[]> {
    return this.prisma.barrel.findMany({
      where: withDeleted ? {} : { deletedAt: null },
      orderBy: { orderNumber: 'asc' },
    });
  }

  async findDeleted(): Promise<Barrel[]> {
    return this.prisma.barrel.findMany({
      where: {
        deletedAt: { not: null },
      },
    });
  }

  async getActiveBarrel(): Promise<Barrel | null> {
    return this.prisma.barrel.findFirst({
      where: { isActive: true, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  }

  async deactivateAllActive(): Promise<number> {
    const res = await this.prisma.barrel.updateMany({
      where: { isActive: true, deletedAt: null },
      data: { isActive: false },
    });
    if (res.count > 0) {
      // Use existing cleanup type enum; keep detail for clarity.
      this.loggingService.logCleanup('BARRELS', { deactivated: res.count });
      await this.leaderboardGateway.emitDashboardUpdate();
    }
    return res.count;
  }

  async findOne(id: string): Promise<Barrel> {
    const barrel = await this.prisma.barrel.findUnique({
      where: { id },
    });
    if (!barrel) {
      throw new NotFoundException(`Sud s ID ${id} nebyl nalezen`);
    }
    return barrel;
  }

  async create(createBarrelDto: CreateBarrelDto): Promise<Barrel> {
    try {
      // Barrel size is already in litres (15L, 30L, or 50L)
      const totalLitres = createBarrelDto.size;
      
      // Create new barrel (inactive by default)
      const savedBarrel = await this.prisma.barrel.create({
        data: {
          ...createBarrelDto,
          size: createBarrelDto.size as 15 | 30 | 50,
          isActive: false,
          remainingBeers: createBarrelDto.size,
          totalBeers: createBarrelDto.size,
          remainingLitres: new Prisma.Decimal(totalLitres),
          totalLitres: new Prisma.Decimal(totalLitres),
        },
      });
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
      await this.findOne(id); // Verify barrel exists
      const savedBarrel = await this.prisma.barrel.update({
        where: { id },
        data: updateBarrelDto,
      });
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

      // Check remaining litres (with tolerance for floating point)
      const remainingLitres = barrel.remainingLitres ? Number(barrel.remainingLitres) : 0;
      if (remainingLitres <= 0.01) {
        throw new BadRequestException('Nelze aktivovat prázdný sud');
      }

      // Deactivate current active barrel if exists
      const currentActive = await this.getActiveBarrel();
      if (currentActive && currentActive.id !== id) {
        await this.prisma.barrel.update({
          where: { id: currentActive.id },
          data: { 
            isActive: false,
            remainingLitres: 0, // Set to 0 when deactivated (as per plan)
          },
        });
      }

      // Activate the new barrel
      const savedBarrel = await this.prisma.barrel.update({
        where: { id },
        data: { isActive: true },
      });
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
      await this.findOne(id);
      await this.prisma.barrel.update({
        where: { id },
        // If a barrel is deleted, it must not remain active (would create “ghost active” state)
        data: { deletedAt: new Date(), isActive: false },
      });
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
        await this.prisma.barrel.update({
          where: { id: barrel.id },
          // Cleanup also soft-deletes, so ensure no barrel stays active
          data: { deletedAt: new Date(), isActive: false },
        });
      }
      this.loggingService.logCleanup('BARRELS', { barrelsDeleted: count });
    } catch (error: unknown) {
      this.loggingService.error('Failed to cleanup barrels', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async decrementLitres(id: string, volumeLitres: number): Promise<void> {
    try {
      const barrel = await this.findOne(id);
      if (!barrel) {
        return;
      }

      const currentRemainingLitres = barrel.remainingLitres ? Number(barrel.remainingLitres) : 0;
      const newRemainingLitres = Math.max(0, currentRemainingLitres - volumeLitres);

      // If remaining litres is <= 0.01 (tolerance for floating point), deactivate the barrel
      if (newRemainingLitres <= 0.01) {
        await this.prisma.barrel.update({
          where: { id },
          data: {
            remainingLitres: 0,
            remainingBeers: 0,
            isActive: false,
          },
        });
        this.loggingService.logBarrelEmpty(id);
        this.loggingService.logBarrelStatusChanged(id, false);
      } else {
        await this.prisma.barrel.update({
          where: { id },
          data: {
            remainingLitres: newRemainingLitres,
          },
        });
        this.loggingService.debug('Barrel litres decremented', {
          id,
          volumeLitres,
          remainingLitres: newRemainingLitres,
        });
      }
    } catch (error: unknown) {
      this.loggingService.error('Failed to decrement barrel litres', {
        id,
        volumeLitres,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async getRemainingLitres(id: string): Promise<number> {
    const barrel = await this.findOne(id);
    return barrel.remainingLitres ? Number(barrel.remainingLitres) : 0;
  }

  // Keep decrementBeers for backward compatibility, but it now uses litres
  async decrementBeers(id: string): Promise<void> {
    // Default to 0.5L for legacy calls
    await this.decrementLitres(id, 0.5);
  }
}
