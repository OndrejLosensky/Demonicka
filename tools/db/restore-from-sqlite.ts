/**
 * Restore production database from SQLite backup
 * WARNING: This will CLEAR all data in the target database and restore from SQLite backup
 */

import { parse } from 'dotenv';
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load production database URL
const prodEnvPath = path.join(__dirname, '.env.prod');
if (!fs.existsSync(prodEnvPath)) {
  console.error('Error: .env.prod not found');
  process.exit(1);
}

const prodEnvContent = fs.readFileSync(prodEnvPath, 'utf-8');
const prodEnv = parse(prodEnvContent);
const prodDatabaseUrl = prodEnv.DATABASE_URL;

if (!prodDatabaseUrl) {
  console.error('Error: DATABASE_URL not found in .env.prod');
  process.exit(1);
}

const EXPORT_DIR = path.join(__dirname, 'exported-data');

// Import the import logic from import-postgres.ts
import { Client as PGClient } from 'pg';
import * as fsPromises from 'fs/promises';

const TABLE_NAME_MAP: Record<string, string> = {
  users: 'User',
  refresh_tokens: 'RefreshToken',
  device_token: 'DeviceToken',
  beers: 'Beer',
  barrels: 'Barrel',
  event: 'Event',
  event_beers: 'EventBeer',
  event_users: 'EventUsers',
  event_barrels: 'EventBarrels',
  achievements: 'Achievement',
  user_achievements: 'UserAchievement',
};

const COLUMN_MAP: Record<string, Record<string, string>> = {
  event_users: {
    event_id: 'eventId',
    user_id: 'userId',
  },
  event_barrels: {
    event_id: 'eventId',
    barrel_id: 'barrelId',
  },
};

const SKIP_COLUMNS: Record<string, string[]> = {
  users: ['profilePicture'],
};

const IMPORT_ORDER = [
  'users',
  'barrels',
  'event',
  'achievements',
  'refresh_tokens',
  'device_token',
  'beers',
  'event_beers',
  'event_users',
  'event_barrels',
  'user_achievements',
];

function convertValue(value: any, columnName: string, tableName: string): any {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number' && (value === 0 || value === 1)) {
    const booleanColumns = ['isActive', 'isRevoked', 'isRegistrationComplete', 'isTwoFactorEnabled', 'isAdminLoginEnabled', 'isAdminDevice', 'biometricEnabled', 'isCompleted', 'spilled', 'isRepeatable'];
    if (booleanColumns.some(col => columnName.toLowerCase().includes(col.toLowerCase()))) {
      return value === 1;
    }
  }

  if (columnName === 'allowedIPs') {
    if (value === null || value === '') {
      return [];
    }
    if (typeof value === 'string') {
      return value.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
    }
    if (Array.isArray(value)) {
      return value;
    }
    return [];
  }

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return new Date(value);
  }

  return value;
}

async function clearDatabase(client: PGClient): Promise<void> {
  console.log('🗑️  Clearing all tables in production database...');
  
  // Disable foreign key checks by truncating in reverse dependency order
  // Order: child tables first (those with foreign keys), then parent tables
  const tablesToTruncate = [
    // Beer Pong tables (children first)
    'BeerPongGameBeer',
    'BeerPongGame',
    'BeerPongTeam',
    'BeerPongEvent',
    // Role/Permission tables
    'RolePermission',
    // Existing tables
    'UserAchievement',
    'EventBarrels',
    'EventUsers',
    'EventBeer',
    'Beer',
    'DeviceToken',
    'RefreshToken',
    'Achievement',
    'Event',
    'Barrel',
    'User',
    // Feature flags and roles/permissions (standalone, can be truncated last)
    'Permission',
    'Role',
    'FeatureFlag',
  ];

  for (const table of tablesToTruncate) {
    try {
      await client.query(`TRUNCATE TABLE "${table}" CASCADE`);
      console.log(`  ✅ Cleared ${table}`);
    } catch (error: any) {
      console.error(`  ⚠️  Error clearing ${table}: ${error.message}`);
    }
  }
}

async function getTableColumns(client: PGClient, tableName: string): Promise<string[]> {
  const result = await client.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = $1
    ORDER BY ordinal_position
  `, [tableName]);
  return result.rows.map(row => row.column_name);
}

async function importTable(client: PGClient, sqliteTableName: string, data: any[]): Promise<void> {
  if (data.length === 0) {
    console.log(`Skipping ${sqliteTableName} (no data)`);
    return;
  }

  const pgTableName = TABLE_NAME_MAP[sqliteTableName] || sqliteTableName;
  console.log(`Importing ${sqliteTableName} -> ${pgTableName} (${data.length} rows)...`);

  // Check if table exists
  const tableCheck = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = $1
    )
  `, [pgTableName.toLowerCase()]);

  if (!tableCheck.rows[0].exists) {
    console.error(`  ❌ Table "${pgTableName}" does not exist in database!`);
    return;
  }

  // Get actual PostgreSQL columns
  const pgActualColumns = await getTableColumns(client, pgTableName.toLowerCase());
  
  const columnMap = COLUMN_MAP[sqliteTableName] || {};
  const skipColumns = SKIP_COLUMNS[sqliteTableName] || [];

  const sqliteColumns = Object.keys(data[0]);
  const pgColumns = sqliteColumns
    .filter(col => !skipColumns.includes(col))
    .map(col => columnMap[col] || col);

  // Check for column mismatches
  const missingColumns = pgColumns.filter(col => !pgActualColumns.includes(col.toLowerCase()));
  const extraColumns = pgActualColumns.filter(col => 
    !pgColumns.map(c => c.toLowerCase()).includes(col) && 
    col !== 'createdAt' && col !== 'updatedAt' // These have defaults
  );

  if (missingColumns.length > 0) {
    console.error(`  ⚠️  Warning: These columns don't exist in PostgreSQL table: ${missingColumns.join(', ')}`);
  }
  if (extraColumns.length > 0) {
    console.warn(`  ⚠️  Warning: These PostgreSQL columns won't be populated (may have defaults): ${extraColumns.join(', ')}`);
  }

  // Filter out columns that don't exist in PostgreSQL
  const validColumns = pgColumns.filter(col => pgActualColumns.includes(col.toLowerCase()));
  
  if (validColumns.length === 0) {
    console.error(`  ❌ No valid columns to import!`);
    return;
  }

  const placeholders = validColumns.map((_, i) => `$${i + 1}`).join(', ');
  const columnNames = validColumns.map(col => `"${col}"`).join(', ');
  const query = `INSERT INTO "${pgTableName}" (${columnNames}) VALUES (${placeholders})`;

  let imported = 0;
  let errors = 0;
  const errorMessages: string[] = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    try {
      // Map values only for valid columns (in correct order)
      const values = validColumns.map(col => {
        // Find the SQLite column name for this PostgreSQL column
        const sqliteCol = sqliteColumns.find(sCol => {
          const mappedCol = columnMap[sCol] || sCol;
          return mappedCol === col;
        });
        
        if (!sqliteCol) {
          return null; // Column doesn't exist in SQLite data
        }
        
        return convertValue(row[sqliteCol], col, sqliteTableName);
      });

      await client.query(query, values);
      imported++;
    } catch (error: any) {
      errors++;
      if (errors <= 10) {
        errorMessages.push(`Row ${i + 1}: ${error.message}`);
      }
    }
  }

  if (errors > 0) {
    console.error(`  ❌ Import failed: ${imported} rows imported, ${errors} rows failed`);
    if (errorMessages.length > 0) {
      console.error(`  First ${Math.min(10, errors)} errors:`);
      errorMessages.forEach(msg => console.error(`    - ${msg}`));
    }
    if (errors === data.length) {
      console.error(`  ⚠️  CRITICAL: ALL rows failed to import! Check column names and data types.`);
    }
  } else {
    console.log(`  ✅ Imported ${imported} rows successfully`);
  }
}

async function main() {
  console.log('⚠️  WARNING: This will CLEAR and RESTORE the PRODUCTION database!');
  console.log('Target database:', prodDatabaseUrl.replace(/:[^:@]+@/, ':****@'));
  console.log('');

  // Load exported data
  const allDataPath = path.join(EXPORT_DIR, 'all-data.json');
  if (!fs.existsSync(allDataPath)) {
    console.error('Error: Export directory not found. Please run: pnpm export:sqlite');
    process.exit(1);
  }

  let allData: Record<string, any[]>;
  try {
    const fileContent = await fsPromises.readFile(allDataPath, 'utf-8');
    allData = JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error reading export file: ${error}`);
    process.exit(1);
  }

  const client = new PGClient({ connectionString: prodDatabaseUrl });

  try {
    await client.connect();
    console.log('✅ Connected to production database\n');

    // Clear all tables
    await clearDatabase(client);
    console.log('');

    // Import tables
    for (const sqliteTableName of IMPORT_ORDER) {
      if (allData[sqliteTableName]) {
        await importTable(client, sqliteTableName, allData[sqliteTableName]);
      }
    }

    // Verify critical tables have data
    console.log('\n🔍 Verifying imported data...');
    const verificationTables = ['User', 'Event'];
    for (const table of verificationTables) {
      const result = await client.query(`SELECT COUNT(*) as count FROM "${table}"`);
      const count = parseInt(result.rows[0].count);
      if (count === 0) {
        console.error(`  ❌ WARNING: Table "${table}" is empty after import!`);
      } else {
        console.log(`  ✅ Table "${table}" has ${count} rows`);
      }
    }

    // Check for orphaned foreign keys
    const orphanCheck = await client.query(`
      SELECT COUNT(*) as count 
      FROM "EventBeer" eb
      WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = eb."userId")
         OR NOT EXISTS (SELECT 1 FROM "Event" e WHERE e.id = eb."eventId")
    `);
    const orphanCount = parseInt(orphanCheck.rows[0].count);
    if (orphanCount > 0) {
      console.error(`  ❌ WARNING: Found ${orphanCount} EventBeer rows with missing foreign keys!`);
    }

    const orphanCheck2 = await client.query(`
      SELECT COUNT(*) as count 
      FROM "EventUsers" eu
      WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = eu."userId")
         OR NOT EXISTS (SELECT 1 FROM "Event" e WHERE e.id = eu."eventId")
    `);
    const orphanCount2 = parseInt(orphanCheck2.rows[0].count);
    if (orphanCount2 > 0) {
      console.error(`  ❌ WARNING: Found ${orphanCount2} EventUsers rows with missing foreign keys!`);
    }

    console.log('\n✅ Production database restored successfully!');
  } catch (error) {
    console.error('Error during restore:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
