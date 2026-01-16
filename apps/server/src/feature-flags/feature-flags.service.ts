import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FeatureFlag } from '@prisma/client';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';

@Injectable()
export class FeatureFlagsService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<FeatureFlag[]> {
    return this.prisma.featureFlag.findMany({
      orderBy: {
        key: 'asc',
      },
    });
  }

  async findOne(id: string): Promise<FeatureFlag> {
    const featureFlag = await this.prisma.featureFlag.findUnique({
      where: { id },
    });
    if (!featureFlag) {
      throw new NotFoundException(`Feature flag with ID ${id} not found`);
    }
    return featureFlag;
  }

  async findByKey(key: string): Promise<FeatureFlag | null> {
    return this.prisma.featureFlag.findUnique({
      where: { key },
    });
  }

  async isEnabled(key: string): Promise<boolean> {
    const featureFlag = await this.findByKey(key);
    return featureFlag?.enabled ?? false;
  }

  async update(
    id: string,
    updateFeatureFlagDto: UpdateFeatureFlagDto,
  ): Promise<FeatureFlag> {
    const featureFlag = await this.findOne(id);
    return this.prisma.featureFlag.update({
      where: { id },
      data: updateFeatureFlagDto,
    });
  }
}
