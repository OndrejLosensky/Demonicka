import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';
import { User } from './users/entities/user.entity';
import { MakeNamesNullable20250520152809 } from './migrations/20250520152809-MakeNamesNullable';
import { RefreshToken } from './auth/entities/refresh-token.entity';
import { Participant } from './participants/entities/participant.entity';
import { Beer } from './beers/entities/beer.entity';
import { Barrel } from './barrels/entities/barrel.entity';
import { AddBarrelOrderAndRemaining1684789261000 } from './migrations/1684789261000-AddBarrelOrderAndRemaining';
import { AddNullableBarrelFields1684789263000 } from './migrations/1684789263000-AddNullableBarrelFields';
import { UpdateBeersTable1684789262000 } from './migrations/1684789262000-UpdateBeersTable';

config();

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: path.join(__dirname, '..', 'data', 'database.sqlite'),
  entities: [User, RefreshToken, Participant, Beer, Barrel],
  migrations: [
    MakeNamesNullable20250520152809,
    AddBarrelOrderAndRemaining1684789261000,
    AddNullableBarrelFields1684789263000,
    UpdateBeersTable1684789262000,
  ],
  synchronize: false,
});
