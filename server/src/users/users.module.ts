import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { UserStatsService } from './user-stats.service';
import { LoggingModule } from '../logging/logging.module';
import { Beer } from '../beers/entities/beer.entity';
import { Event } from '../events/entities/event.entity';
import { EventBeer } from '../events/entities/event-beer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Beer, Event, EventBeer]),
    LoggingModule,
  ],
  providers: [UsersService, UserStatsService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
