import { parse } from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { Client } from 'pg';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load production and development environment files from tools/db directory
const prodEnvPath = path.join(__dirname, '.env.prod');
const devEnvPath = path.join(__dirname, '.env.dev');

if (!fs.existsSync(prodEnvPath)) {
  console.error(`Error: Production environment file not found at ${prodEnvPath}`);
  process.exit(1);
}

if (!fs.existsSync(devEnvPath)) {
  console.error(`Error: Development environment file not found at ${devEnvPath}`);
  process.exit(1);
}

// Parse env files without modifying process.env
const prodEnvContent = fs.readFileSync(prodEnvPath, 'utf-8');
const devEnvContent = fs.readFileSync(devEnvPath, 'utf-8');

const prodEnv = parse(prodEnvContent);
const devEnv = parse(devEnvContent);

const prodDatabaseUrl = prodEnv.DATABASE_URL;
const devDatabaseUrl = devEnv.DATABASE_URL;

if (!prodDatabaseUrl) {
  console.error('Error: DATABASE_URL not found in .env.prod');
  process.exit(1);
}

if (!devDatabaseUrl) {
  console.error('Error: DATABASE_URL not found in .env.dev');
  process.exit(1);
}

// Create temp directory for dump file
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const dumpFile = path.join(tempDir, 'prod-dump.sql');

async function main() {
  let preserveDumpFile = false;
  
  try {
    console.log('🔄 Starting database refresh from production to development...');
    console.log('📦 Dumping production database...');

    // Dump production database
    // We'll drop tables manually before restore, so no --clean flag needed
    // --no-owner: don't set ownership (useful for different users)
    // --no-privileges: don't dump access privileges
    // Note: pg_dump automatically includes ALL tables (including new beer pong tables if they exist in prod)
    const dumpCommand = `pg_dump "${prodDatabaseUrl}" --no-owner --no-privileges -f "${dumpFile}"`;
    
    await execAsync(dumpCommand);
    console.log('✅ Production database dumped successfully');
    console.log(`   Dump file: ${dumpFile}`);

    console.log('🗑️  Clearing development database...');
    
    // First, drop all tables and types with CASCADE to avoid dependency issues
    // This ensures we can cleanly restore without constraint dependency conflicts
    const client = new Client({ connectionString: devDatabaseUrl });
    try {
      await client.connect();
      
      // Drop all tables first (CASCADE will handle foreign keys)
      const tablesResult = await client.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename
      `);
      
      if (tablesResult.rows.length > 0) {
        console.log(`   Dropping ${tablesResult.rows.length} existing tables...`);
        for (const row of tablesResult.rows) {
          try {
            await client.query(`DROP TABLE IF EXISTS "${row.tablename}" CASCADE`);
          } catch (dropError: any) {
            console.warn(`   ⚠️  Could not drop table ${row.tablename}: ${dropError.message}`);
          }
        }
        console.log('   ✅ All tables dropped');
      }
      
      // Drop all custom types (enums) - they persist after dropping tables
      const typesResult = await client.query(`
        SELECT typname 
        FROM pg_type 
        WHERE typtype = 'e'
        AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        ORDER BY typname
      `);
      
      if (typesResult.rows.length > 0) {
        console.log(`   Dropping ${typesResult.rows.length} existing types...`);
        for (const row of typesResult.rows) {
          try {
            await client.query(`DROP TYPE IF EXISTS "${row.typname}" CASCADE`);
          } catch (dropError: any) {
            console.warn(`   ⚠️  Could not drop type ${row.typname}: ${dropError.message}`);
          }
        }
        console.log('   ✅ All types dropped');
      }
      
      await client.end();
    } catch (dropError: any) {
      console.error(`   ⚠️  Error dropping tables/types: ${dropError.message}`);
      await client.end();
    }
    
    console.log('📥 Restoring to development database...');
    
    // Restore to development database
    // --set ON_ERROR_STOP=on: stop on errors (default behavior, but explicit)
    // We've already dropped tables above, so the dump will just create and populate
    const restoreCommand = `psql "${devDatabaseUrl}" --set ON_ERROR_STOP=on -f "${dumpFile}"`;
    
    const restoreResult = await execAsync(restoreCommand);
    
    // Check for errors in stderr (psql outputs errors to stderr even on success sometimes)
    if (restoreResult.stderr) {
      console.warn('⚠️  psql warnings/output:', restoreResult.stderr);
    }
    
    console.log('✅ Development database restored successfully');
    
    // Run migration script to upgrade schema from v2 (production) to v3 (current)
    // This handles adding missing columns like canLogin, createdBy, etc.
    console.log('\n🔄 Running v2 to v3 migration (updating schema)...');
    const migrateCommand = `tsx "${path.join(__dirname, 'migrate-v2-to-v3.ts')}" "${devDatabaseUrl}"`;
    
    try {
      const migrateResult = await execAsync(migrateCommand);
      console.log('✅ Schema migration completed');
      if (migrateResult.stderr && !migrateResult.stderr.includes('Connected')) {
        console.log(migrateResult.stderr);
      }
    } catch (migrateError: any) {
      console.error(`❌ Migration failed: ${migrateError.message}`);
      if (migrateError.stderr) {
        console.error(migrateError.stderr);
      }
      preserveDumpFile = true;
    }

    // Verify critical tables have data
    console.log('\n🔍 Verifying imported data...');
    const verifyClient = new Client({ connectionString: devDatabaseUrl });
    
    try {
      await verifyClient.connect();
      
      const verificationTables = ['User', 'Event'];
      for (const table of verificationTables) {
        const result = await verifyClient.query(`SELECT COUNT(*) as count FROM "${table}"`);
        const count = parseInt(result.rows[0].count);
        if (count === 0) {
          console.error(`  ❌ WARNING: Table "${table}" is empty after restore!`);
          
          // Check if table exists
          const tableExists = await verifyClient.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_name = $1
            )
          `, [table.toLowerCase()]);
          
          if (!tableExists.rows[0].exists) {
            console.error(`  ❌ Table "${table}" doesn't exist! Schema may not match.`);
          } else {
            console.error(`  ⚠️  Table exists but has no data. Check restore logs for INSERT errors.`);
          }
        } else {
          console.log(`  ✅ Table "${table}" has ${count} rows`);
        }
      }

      // Check for orphaned foreign keys (data in child tables without parent records)
      const orphanCheck = await verifyClient.query(`
        SELECT COUNT(*) as count 
        FROM "EventBeer" eb
        WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = eb."userId")
           OR NOT EXISTS (SELECT 1 FROM "Event" e WHERE e.id = eb."eventId")
      `);
      const orphanCount = parseInt(orphanCheck.rows[0].count);
      if (orphanCount > 0) {
        console.error(`  ❌ WARNING: Found ${orphanCount} EventBeer rows with missing foreign keys!`);
        console.error(`     This should not be possible if foreign key constraints are enabled.`);
        preserveDumpFile = true;
      }

      const orphanCheck2 = await verifyClient.query(`
        SELECT COUNT(*) as count 
        FROM "EventUsers" eu
        WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = eu."userId")
           OR NOT EXISTS (SELECT 1 FROM "Event" e WHERE e.id = eu."eventId")
      `);
      const orphanCount2 = parseInt(orphanCheck2.rows[0].count);
      if (orphanCount2 > 0) {
        console.error(`  ❌ WARNING: Found ${orphanCount2} EventUsers rows with missing foreign keys!`);
        console.error(`     This should not be possible if foreign key constraints are enabled.`);
        preserveDumpFile = true;
      }
      
      // Check if User or Event are empty
      const userCount = await verifyClient.query(`SELECT COUNT(*) as count FROM "User"`);
      const eventCount = await verifyClient.query(`SELECT COUNT(*) as count FROM "Event"`);
      if (parseInt(userCount.rows[0].count) === 0 || parseInt(eventCount.rows[0].count) === 0) {
        preserveDumpFile = true;
      }

      // Check if foreign key constraints are enabled
      const fkCheck = await verifyClient.query(`
        SELECT COUNT(*) as count
        FROM information_schema.table_constraints
        WHERE constraint_type = 'FOREIGN KEY'
        AND table_name IN ('EventBeer', 'EventUsers')
      `);
      const fkCount = parseInt(fkCheck.rows[0].count);
      console.log(`  ℹ️  Found ${fkCount} foreign key constraints on EventBeer/EventUsers tables`);
      
      if (fkCount === 0) {
        console.warn(`  ⚠️  WARNING: No foreign key constraints found! This could explain the orphaned data.`);
      }

    } catch (verifyError: any) {
      console.error(`  ⚠️  Error during verification: ${verifyError.message}`);
      preserveDumpFile = true;
    } finally {
      await verifyClient.end();
    }

    // Clean up dump file (preserve if there were issues)
    if (fs.existsSync(dumpFile)) {
      if (preserveDumpFile) {
        console.log(`\n⚠️  Dump file preserved at ${dumpFile} for inspection`);
      } else {
        fs.unlinkSync(dumpFile);
        console.log('\n🧹 Temporary dump file cleaned up');
      }
    }

    if (preserveDumpFile) {
      console.log('\n⚠️  Database refresh completed with warnings. Please review the output above.');
    } else {
      console.log('\n🎉 Database refresh completed successfully!');
    }
  } catch (error: any) {
    console.error('❌ Error during database refresh:', error.message);
    if (error.stderr) {
      console.error('Error details:', error.stderr);
    }
    if (error.stdout) {
      console.error('Output:', error.stdout);
    }
    
    // Preserve dump file on error for inspection
    if (fs.existsSync(dumpFile)) {
      console.error(`\n⚠️  Dump file preserved at ${dumpFile} for inspection`);
    }
    
    process.exit(1);
  }
}

main();
