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
import { EventBeer } from './events/entities/event-beer.entity';
import { Achievement } from './achievements/entities/achievement.entity';
import { UserAchievement } from './achievements/entities/user-achievement.entity';
import { InitialSchema1711638000000 } from './migrations/1711638000000-InitialSchema';
import { AddEventsTable1711638000001 } from './migrations/1711638000001-AddEventsTable';
import { MakeNameNullable1748441344604 } from './migrations/1748441344604-MakeNameNullable';
import { AddDeviceTokenTable1711638000002 } from './migrations/1711638000002-AddDeviceTokenTable';
import { AddAdminFields1711638000003 } from './migrations/1711638000003-AddAdminFields';
import { AddRoleColumn1748441344605 } from './migrations/1748441344605-AddRoleColumn';
import { CreateEventBeersTable1749757491913 } from './migrations/1749757491913-CreateEventBeersTable';
import { AddFirstLastNameToUser1749763388825 } from './migrations/1749763388825-AddFirstLastNameToUser';
import { AddTotalBeersToBarrels1749975358935 } from './migrations/1749975358935-AddTotalBeersToBarrels';
import { CreateAchievementsTables1750000000000 } from './migrations/1750000000000-CreateAchievementsTables';
import { AddProfilePictureToUser1757947503551 } from './migrations/1757947503551-AddProfilePictureToUser';

config();

// Get database path from environment or use default
const dbPath =
  process.env.DATABASE_URL ||
  path.join(process.cwd(), 'data', 'database.sqlite');

// Create the directory if it doesn't exist
const dbDir = path.dirname(dbPath);
try {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
} catch (error) {
  console.warn('Could not create database directory:', error);
  // Continue anyway as the directory might be created by Docker or the system
}

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: dbPath,
  entities: [User, RefreshToken, Beer, Barrel, Event, DeviceToken, EventBeer, Achievement, UserAchievement],
  migrations: [
    InitialSchema1711638000000,
    AddEventsTable1711638000001,
    AddDeviceTokenTable1711638000002,
    AddAdminFields1711638000003,
    MakeNameNullable1748441344604,
    AddRoleColumn1748441344605,
    CreateEventBeersTable1749757491913,
    AddFirstLastNameToUser1749763388825,
    AddTotalBeersToBarrels1749975358935,
    CreateAchievementsTables1750000000000,
    AddProfilePictureToUser1757947503551,
  ],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  migrationsRun: true,
});
