import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ParticipantsModule } from './participants/participants.module';
import { BeersModule } from './beers/beers.module';
import { BarrelsModule } from './barrels/barrels.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { VersioningModule } from './versioning/versioning.module';
import { LoggingModule } from './logging/logging.module';
import { EventsModule } from './events/events.module';
import * as cookieParser from 'cookie-parser';
import { VersionMiddleware } from './versioning/middleware/version.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'data/database.sqlite',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    AuthModule,
    UsersModule,
    ParticipantsModule,
    BeersModule,
    BarrelsModule,
    DashboardModule,
    VersioningModule,
    LoggingModule,
    EventsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(cookieParser(), VersionMiddleware).forRoutes('*');
  }
}
