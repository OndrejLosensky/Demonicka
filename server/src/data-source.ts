import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { User } from './users/entities/user.entity';
import { RefreshToken } from './auth/entities/refresh-token.entity';
import { Beer } from './beers/entities/beer.entity';
import { Barrel } from './barrels/entities/barrel.entity';
import { Event } from './events/entities/event.entity';
import { DeviceToken } from './auth/entities/device-token.entity';
import { InitialSchema1711638000000 } from './migrations/1711638000000-InitialSchema';
import { AddEventsTable1711638000001 } from './migrations/1711638000001-AddEventsTable';
import { MakeNameNullable1748441344604 } from './migrations/1748441344604-MakeNameNullable';
import { AddDeviceTokenTable1711638000002 } from './migrations/1711638000002-AddDeviceTokenTable';
import { AddAdminFields1711638000003 } from './migrations/1711638000003-AddAdminFields';
import { AddRoleColumn1748441344605 } from './migrations/1748441344605-AddRoleColumn';
import { EventBeer } from './events/entities/event-beer.entity';
import { CreateEventBeersTable1749757491913 } from './migrations/1749757491913-CreateEventBeersTable';

config();

// Store database in server/data directory
const dbPath = path.join(process.cwd(), 'data', 'database.sqlite');

// Create the directory if it doesn't exist
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: dbPath,
  entities: [User, RefreshToken, Beer, Barrel, Event, DeviceToken, EventBeer],
  migrations: [
    InitialSchema1711638000000,
    AddEventsTable1711638000001,
    AddDeviceTokenTable1711638000002,
    AddAdminFields1711638000003,
    MakeNameNullable1748441344604,
    AddRoleColumn1748441344605,
    CreateEventBeersTable1749757491913,
  ],
  synchronize: false,
  logging: false,
});
