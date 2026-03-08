import { Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';
import { SystemOperationsController } from './system-operations.controller';
import { ExportsModule } from '../exports/exports.module';
import { JobQueueModule } from '../job-queue/job-queue.module';
import { LoggingModule } from '../logging/logging.module';

@Module({
  imports: [ExportsModule, JobQueueModule, LoggingModule],
  controllers: [SystemController, SystemOperationsController],
  providers: [SystemService],
  exports: [SystemService],
})
export class SystemModule {}
