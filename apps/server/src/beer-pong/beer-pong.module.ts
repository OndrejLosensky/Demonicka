import { Module, forwardRef } from '@nestjs/common';
import { BeerPongController } from './beer-pong.controller';
import { BeerPongService } from './beer-pong.service';
import { BeerPongTeamsService } from './beer-pong-teams.service';
import { BeerPongGamesService } from './beer-pong-games.service';
import { EventsModule } from '../events/events.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RolesModule } from '../roles/roles.module';
import { BeerPongDefaultsModule } from '../beer-pong-defaults/beer-pong-defaults.module';
import { LoggingModule } from '../logging/logging.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => EventsModule),
    RolesModule,
    BeerPongDefaultsModule,
    LoggingModule,
  ],
  controllers: [BeerPongController],
  providers: [BeerPongService, BeerPongTeamsService, BeerPongGamesService],
  exports: [BeerPongService, BeerPongTeamsService, BeerPongGamesService],
})
export class BeerPongModule {}
