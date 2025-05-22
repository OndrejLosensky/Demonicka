import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BeersController } from './beers.controller';
import { BeersService } from './beers.service';
import { Beer } from './entities/beer.entity';
import { ParticipantsModule } from '../participants/participants.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Beer]),
    ParticipantsModule,
  ],
  controllers: [BeersController],
  providers: [BeersService],
  exports: [BeersService],
})
export class BeersModule {} 