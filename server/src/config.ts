import * as dotenv from 'dotenv';
dotenv.config();

export const config = {
  jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-key-2024',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-jwt-refresh-secret-key-2024',
  databasePath: process.env.DATABASE_PATH || 'db.sqlite',
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
};
