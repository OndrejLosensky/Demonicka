import { Module, forwardRef } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { EventBeersService } from './services/event-beers.service';
import { EventBeersController } from './controllers/event-beers.controller';
import { EventBeerPongTeamsService } from './services/event-beer-pong-teams.service';
import { EventBeerPongTeamsController } from './controllers/event-beer-pong-teams.controller';
import { BeersModule } from '../beers/beers.module';
import { BarrelsModule } from '../barrels/barrels.module';
import { LoggingModule } from '../logging/logging.module';
import { UsersModule } from '../users/users.module';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';
import { BeerPongModule } from '../beer-pong/beer-pong.module';
import { ExportsModule } from '../exports/exports.module';

@Module({
    imports: [
        forwardRef(() => BeersModule),
        BarrelsModule,
        LoggingModule,
        UsersModule,
        LeaderboardModule,
        forwardRef(() => BeerPongModule),
        ExportsModule,
    ],
    controllers: [EventBeerPongTeamsController, EventBeersController, EventsController],
    providers: [EventsService, EventBeersService, EventBeerPongTeamsService],
    exports: [EventsService, EventBeersService, EventBeerPongTeamsService],
})
export class EventsModule {}
