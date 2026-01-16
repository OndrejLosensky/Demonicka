import { Module } from '@nestjs/common';
import { FeatureFlagsService } from './feature-flags.service';
import { FeatureFlagsController } from './feature-flags.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [FeatureFlagsService],
  controllers: [FeatureFlagsController],
  exports: [FeatureFlagsService],
})
export class FeatureFlagsModule {}
