import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoggingService } from '../logging/logging.service';
import { UpdateBeerPongDefaultsDto } from './dto/update-beer-pong-defaults.dto';
import type { BeerPongDefaults } from '@prisma/client';

@Injectable()
export class BeerPongDefaultsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logging: LoggingService,
  ) {}

  async getOrCreate(): Promise<BeerPongDefaults> {
    const existing = await this.prisma.beerPongDefaults.findFirst();
    if (existing) return existing;

    return this.prisma.beerPongDefaults.create({
      data: {},
    });
  }

  async get(): Promise<BeerPongDefaults> {
    return this.getOrCreate();
  }

  async update(
    dto: UpdateBeerPongDefaultsDto,
    actorUserId: string,
  ): Promise<BeerPongDefaults> {
    const current = await this.getOrCreate();

    const updated = await this.prisma.beerPongDefaults.update({
      where: { id: current.id },
      data: {
        ...dto,
        updatedBy: actorUserId,
      },
    });

    this.logging.info('Settings changed', {
      event: 'SETTINGS_CHANGED',
      setting: 'BEER_PONG_DEFAULTS',
      actorUserId,
      old: {
        beersPerPlayer: current.beersPerPlayer,
        timeWindowMinutes: current.timeWindowMinutes,
        undoWindowMinutes: current.undoWindowMinutes,
        cancellationPolicy: current.cancellationPolicy,
      },
      new: {
        beersPerPlayer: updated.beersPerPlayer,
        timeWindowMinutes: updated.timeWindowMinutes,
        undoWindowMinutes: updated.undoWindowMinutes,
        cancellationPolicy: updated.cancellationPolicy,
      },
    });

    return updated;
  }
}

