import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { User } from '../users/entities/user.entity';
import { Beer } from '../beers/entities/beer.entity';
import { Barrel } from '../barrels/entities/barrel.entity';
import { Event } from '../events/entities/event.entity';
import { EventBeer } from '../events/entities/event-beer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Beer, Barrel, Event, EventBeer])],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
