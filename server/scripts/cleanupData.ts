import { AppDataSource } from '../src/data-source';

async function cleanupData() {
  console.log('Starting data cleanup (preserving users)...');

  try {
    await AppDataSource.initialize();
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      console.log('Cleaning up events and related data...');
      await queryRunner.query('DELETE FROM "event"');
      
      console.log('Cleaning up participants and related data...');
      await queryRunner.query('DELETE FROM "participants"');
      
      console.log('Cleaning up barrels and related data...');
      await queryRunner.query('DELETE FROM "barrels"');
      
      console.log('Cleaning up beers...');
      await queryRunner.query('DELETE FROM "beer"');

      await queryRunner.commitTransaction();
      console.log('✅ Database cleanup completed successfully! (Users preserved)');
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
cleanupData()
  .catch((error) => {
    console.error('Failed to clean up database:', error);
    process.exit(1);
  }); 