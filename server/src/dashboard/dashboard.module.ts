import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Participant } from '../participants/entities/participant.entity';
import { Beer } from '../beers/entities/beer.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Barrel } from 'src/barrels/entities/barrel.entity';
import { Event } from '../events/entities/event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Participant, Beer, Barrel, Event])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
