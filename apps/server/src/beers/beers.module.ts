import { Module, forwardRef } from '@nestjs/common';
import { BeersController } from './beers.controller';
import { BeersService } from './beers.service';
import { BarrelsModule } from '../barrels/barrels.module';
import { LoggingModule } from '../logging/logging.module';
import { EventsModule } from '../events/events.module';
import { AchievementsModule } from '../achievements/achievements.module';

@Module({
  imports: [
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
