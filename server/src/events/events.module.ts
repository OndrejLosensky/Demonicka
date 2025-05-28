import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { Event } from './entities/event.entity';
import { User } from '../users/entities/user.entity';
import { Barrel } from '../barrels/entities/barrel.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Event, User, Barrel])],
    controllers: [EventsController],
    providers: [EventsService],
    exports: [EventsService],
})
export class EventsModule {} 