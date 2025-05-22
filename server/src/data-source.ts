import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

config();

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: path.join(__dirname, '..', 'database.sqlite'),
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
});
