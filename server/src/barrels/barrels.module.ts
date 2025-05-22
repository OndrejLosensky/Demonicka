import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BarrelsService } from './barrels.service';
import { BarrelsController } from './barrels.controller';
import { Barrel } from './entities/barrel.entity';
import { LoggingModule } from '../logging/logging.module';

@Module({
  imports: [TypeOrmModule.forFeature([Barrel]), LoggingModule],
  controllers: [BarrelsController],
  providers: [BarrelsService],
  exports: [BarrelsService],
})
export class BarrelsModule {}
