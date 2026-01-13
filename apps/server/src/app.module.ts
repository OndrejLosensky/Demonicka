import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BeersModule } from './beers/beers.module';
import { BarrelsModule } from './barrels/barrels.module';
import { EventsModule } from './events/events.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { LoggingModule } from './logging/logging.module';
import { VersioningModule } from './versioning/versioning.module';
import { DocsModule } from './docs/docs.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { BackupModule } from './backup/backup.module';
import { SystemModule } from './system/system.module';
import { AchievementsModule } from './achievements/achievements.module';
import { PrismaModule } from './prisma/prisma.module';
import * as cookieParser from 'cookie-parser';
import { VersionMiddleware } from './versioning/middleware/version.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Load .env.prod if NODE_ENV is production, otherwise load .env (dev)
      envFilePath: process.env.NODE_ENV === 'production' ? '.env.prod' : '.env',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    BeersModule,
    BarrelsModule,
    EventsModule,
    DashboardModule,
    LoggingModule,
    VersioningModule,
    DocsModule,
    LeaderboardModule,
    BackupModule,
    SystemModule,
    AchievementsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(cookieParser(), VersionMiddleware).forRoutes('*');
  }
}
