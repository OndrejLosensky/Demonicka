import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';
import { RefreshToken } from './auth/entities/refresh-token.entity';
import { config } from './config';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: config.databasePath,
      entities: [User, RefreshToken],
      synchronize: true, // Only for development! Disable in production
    }),
    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}
