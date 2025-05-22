import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ParticipantsModule } from './participants/participants.module';
import { BeersModule } from './beers/beers.module';
import { BarrelsModule } from './barrels/barrels.module';
import * as cookieParser from 'cookie-parser';
import * as path from 'path';
import { User } from './users/entities/user.entity';
import { RefreshToken } from './auth/entities/refresh-token.entity';
import { Participant } from './participants/entities/participant.entity';
import { Beer } from './beers/entities/beer.entity';
import { Barrel } from './barrels/entities/barrel.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'sqlite',
        database: path.join(__dirname, '..', 'data', 'database.sqlite'),
        entities: [User, RefreshToken, Participant, Beer, Barrel],
        synchronize: configService.get('NODE_ENV') !== 'production',
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    ParticipantsModule,
    BeersModule,
    BarrelsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(cookieParser()).forRoutes('*');
  }
}
