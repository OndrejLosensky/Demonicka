import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BeersController } from './beers.controller';
import { BeersService } from './beers.service';
import { Beer } from './entities/beer.entity';
import { User } from '../users/entities/user.entity';
import { Barrel } from '../barrels/entities/barrel.entity';
import { BarrelsModule } from '../barrels/barrels.module';
import { LoggingModule } from '../logging/logging.module';
import { EventsModule } from '../events/events.module';
import { AchievementsModule } from '../achievements/achievements.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Beer, User, Barrel]),
    BarrelsModule,
    LoggingModule,
    forwardRef(() => EventsModule),
    AchievementsModule,
  ],
  controllers: [BeersController],
  providers: [BeersService],
  exports: [BeersService],
})
export class BeersModule {}
