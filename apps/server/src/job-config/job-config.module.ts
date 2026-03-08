import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { JobConfigService } from './job-config.service';
import { JobConfigController } from './job-config.controller';

@Module({
  imports: [PrismaModule],
  controllers: [JobConfigController],
  providers: [JobConfigService],
  exports: [JobConfigService],
})
export class JobConfigModule {}
