import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import * as cookieParser from 'cookie-parser';
import { VersionMiddleware } from './versioning/middleware/version.middleware';
import { AppDataSource } from './data-source';
import { ConfigModule } from './config/config.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule,
    CommonModule,
    TypeOrmModule.forRoot(AppDataSource.options),
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
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(cookieParser(), VersionMiddleware).forRoutes('*');
  }
}
