import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';
import { User } from './users/entities/user.entity';
import { RefreshToken } from './auth/entities/refresh-token.entity';
import { Beer } from './beers/entities/beer.entity';
import { Barrel } from './barrels/entities/barrel.entity';
import { Event } from './events/entities/event.entity';
import { InitialSchema1711638000000 } from './migrations/1711638000000-InitialSchema';
import { AddEventsTable1711638000001 } from './migrations/1711638000001-AddEventsTable';
import { MakeNameNullable1748441344604 } from './migrations/1748441344604-MakeNameNullable';

config();

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: path.join(__dirname, '..', 'data', 'database.sqlite'),
  entities: [User, RefreshToken, Beer, Barrel, Event],
  migrations: [
    InitialSchema1711638000000,
    AddEventsTable1711638000001,
    MakeNameNullable1748441344604
  ],
  synchronize: true,
});
