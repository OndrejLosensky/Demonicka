import { AppDataSource } from '../data-source';

const markMigrationsAsComplete = async () => {
  try {
    await AppDataSource.initialize();
    const queryRunner = AppDataSource.createQueryRunner();

    // First, clear any existing migration records
    await queryRunner.query('DELETE FROM migrations');

    // Insert records for all existing migrations
    await queryRunner.query(`
      INSERT INTO migrations (timestamp, name)
      VALUES 
        (1711638000000, 'InitialSchema1711638000000'),
        (1711638000001, 'AddEventsTable1711638000001'),
        (1748441344604, 'MakeNameNullable1748441344604'),
        (1711638000002, 'AddDeviceTokenTable1711638000002')
    `);

    console.log('✅ Successfully marked migrations as complete');
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Failed to mark migrations as complete:', error);
    process.exit(1);
  }
};

markMigrationsAsComplete(); 