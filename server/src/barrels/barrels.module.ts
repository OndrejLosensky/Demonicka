import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BarrelsService } from './barrels.service';
import { BarrelsController } from './barrels.controller';
import { Barrel } from './entities/barrel.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Barrel])],
  controllers: [BarrelsController],
  providers: [BarrelsService],
  exports: [BarrelsService],
})
export class BarrelsModule {}
