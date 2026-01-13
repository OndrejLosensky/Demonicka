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
  const tablesToTruncate = [
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

async function importTable(client: PGClient, sqliteTableName: string, data: any[]): Promise<void> {
  if (data.length === 0) {
    return;
  }

  const pgTableName = TABLE_NAME_MAP[sqliteTableName] || sqliteTableName;
  console.log(`Importing ${sqliteTableName} -> ${pgTableName} (${data.length} rows)...`);

  const columnMap = COLUMN_MAP[sqliteTableName] || {};
  const skipColumns = SKIP_COLUMNS[sqliteTableName] || [];

  const sqliteColumns = Object.keys(data[0]);
  const pgColumns = sqliteColumns
    .filter(col => !skipColumns.includes(col))
    .map(col => columnMap[col] || col);

  if (pgColumns.length === 0) {
    return;
  }

  const placeholders = pgColumns.map((_, i) => `$${i + 1}`).join(', ');
  const columnNames = pgColumns.map(col => `"${col}"`).join(', ');
  const query = `INSERT INTO "${pgTableName}" (${columnNames}) VALUES (${placeholders})`;

  let imported = 0;
  let errors = 0;

  for (const row of data) {
    try {
      const values = sqliteColumns
        .filter(col => !skipColumns.includes(col))
        .map(col => {
          const pgColName = columnMap[col] || col;
          return convertValue(row[col], pgColName, sqliteTableName);
        });

      await client.query(query, values);
      imported++;
    } catch (error: any) {
      errors++;
      if (errors <= 5) {
        console.error(`  Error importing row:`, error.message);
        if (errors === 5) {
          console.error(`  ... (suppressing further errors)`);
        }
      }
    }
  }

  console.log(`  ✅ Imported ${imported} rows, ${errors} errors`);
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

    console.log('\n✅ Production database restored successfully!');
  } catch (error) {
    console.error('Error during restore:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
