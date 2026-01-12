import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { Event } from './entities/event.entity';
import { User } from '../users/entities/user.entity';
import { Barrel } from '../barrels/entities/barrel.entity';
import { EventBeer } from './entities/event-beer.entity';
import { EventBeersService } from './services/event-beers.service';
import { EventBeersController } from './controllers/event-beers.controller';
import { BeersModule } from '../beers/beers.module';
import { BarrelsModule } from '../barrels/barrels.module';
import { LoggingModule } from '../logging/logging.module';
import { UsersModule } from '../users/users.module';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Event, User, Barrel, EventBeer]),
        forwardRef(() => BeersModule),
        BarrelsModule,
        LoggingModule,
        UsersModule,
        LeaderboardModule,
    ],
    controllers: [EventsController, EventBeersController],
    providers: [EventsService, EventBeersService],
    exports: [EventsService, EventBeersService],
})
export class EventsModule {} 