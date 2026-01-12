import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AchievementsController } from './achievements.controller';
import { AchievementsService } from './achievements.service';
import { Achievement } from './entities/achievement.entity';
import { UserAchievement } from './entities/user-achievement.entity';
import { User } from '../users/entities/user.entity';
import { EventBeer } from '../events/entities/event-beer.entity';
import { Event } from '../events/entities/event.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Achievement,
      UserAchievement,
      User,
      EventBeer,
      Event,
    ]),
  ],
  controllers: [AchievementsController],
  providers: [AchievementsService],
  exports: [AchievementsService],
})
export class AchievementsModule {} 