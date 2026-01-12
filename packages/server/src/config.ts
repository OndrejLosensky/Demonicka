import * as dotenv from 'dotenv';
dotenv.config();

export const config = {
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  databasePath: process.env.DATABASE_PATH,
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  bypassAuth: {
    enabled: process.env.BYPASS_AUTH_ENABLED,
    token: process.env.BYPASS_AUTH_TOKEN,
  },
};
