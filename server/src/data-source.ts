import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';
import { User } from './users/entities/user.entity';
import { MakeNamesNullable20250520152809 } from './migrations/20250520152809-MakeNamesNullable';
import { RefreshToken } from './auth/entities/refresh-token.entity';
import { Participant } from './participants/entities/participant.entity';
import { Beer } from './beers/entities/beer.entity';
import { Barrel } from './barrels/entities/barrel.entity';

config();

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: path.join(__dirname, '..', 'data', 'database.sqlite'),
  entities: [User, RefreshToken, Participant, Beer, Barrel],
  migrations: [MakeNamesNullable20250520152809],
  synchronize: false,
});
