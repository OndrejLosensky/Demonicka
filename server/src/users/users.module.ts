import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { UserStatsService } from './user-stats.service';
import { LoggingModule } from '../logging/logging.module';
import { Beer } from '../beers/entities/beer.entity';
import { Event } from '../events/entities/event.entity';
import { EventBeer } from '../events/entities/event-beer.entity';
import { UserPreferences } from './entities/user-preferences.entity';
import { UserPreferencesService } from './user-preferences.service';
import { UserPreferencesController } from './controllers/user-preferences.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Beer, Event, EventBeer, UserPreferences]),
    LoggingModule,
    forwardRef(() => AuthModule),
  ],
  providers: [UsersService, UserStatsService, UserPreferencesService],
  controllers: [UsersController, UserPreferencesController],
  exports: [UsersService],
})
export class UsersModule {}
