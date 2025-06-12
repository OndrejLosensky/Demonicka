import { AppDataSource } from '../src/data-source';

async function cleanupAll() {
  console.log('Starting complete database cleanup...');

  try {
    await AppDataSource.initialize();
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      console.log('Cleaning up events and related data...');
      await queryRunner.query('DELETE FROM "event"');
      await queryRunner.query('DELETE FROM "event_users"');
      await queryRunner.query('DELETE FROM "event_barrels"');
      
      console.log('Cleaning up participants and related data...');
      
      console.log('Cleaning up barrels and related data...');
      await queryRunner.query('DELETE FROM "barrels"');
      
      console.log('Cleaning up beers...');
      await queryRunner.query('DELETE FROM "beers"');
      
      console.log('Cleaning up users and related data...');
      await queryRunner.query('DELETE FROM "refresh_tokens"');
      await queryRunner.query('DELETE FROM "users"');

      await queryRunner.commitTransaction();
      console.log('✅ Database cleanup completed successfully!');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// Execute the cleanup
cleanupAll()
  .catch((error) => {
    console.error('Failed to clean up database:', error);
    process.exit(1);
  }); 