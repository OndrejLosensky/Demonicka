import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { MakeNamesNullable20250520152809 } from '../migrations/20250520152809-MakeNamesNullable';

export default new DataSource({
  type: 'sqlite',
  database: 'database.sqlite',
  entities: [User],
  migrations: [MakeNamesNullable20250520152809],
});
