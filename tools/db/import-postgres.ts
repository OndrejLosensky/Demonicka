/**
 * Import data from JSON export files into PostgreSQL database
 * 
 * Usage: pnpm import:postgres
 * 
 * This script imports data from the exported JSON files into PostgreSQL.
 * It handles data type conversions, column name mappings, and respects foreign key constraints.
 */

import { Client } from 'pg';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory
const serverEnvPath = path.join(__dirname, '../../apps/server/.env');
config({ path: serverEnvPath });

const EXPORT_DIR = path.join(__dirname, 'exported-data');
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is not set');
  console.error('Please set it in apps/server/.env or export it in your shell');
  process.exit(1);
}

// Map SQLite table names to Prisma model names (PostgreSQL table names)
const TABLE_NAME_MAP: Record<string, string> = {
  users: 'User',
  refresh_tokens: 'RefreshToken',
  device_token: 'DeviceToken',
  beers: 'Beer',
  barrels: 'Barrel',
  event: 'Event', // SQLite table is "event" (singular)
  event_beers: 'EventBeer',
  event_users: 'EventUsers',
  event_barrels: 'EventBarrels',
  achievements: 'Achievement',
  user_achievements: 'UserAchievement',
};

// Column name mappings: SQLite column -> PostgreSQL column
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

// Columns to skip (exist in SQLite but not in PostgreSQL schema)
const SKIP_COLUMNS: Record<string, string[]> = {
  users: ['profilePicture'], // Not in Prisma schema
};

// Tables in dependency order for import
const IMPORT_ORDER = [
  'users',
  'barrels',
  'event', // SQLite table is "event" (singular)
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

  // Handle booleans (SQLite stores as 0/1, PostgreSQL needs true/false)
  if (typeof value === 'number' && (value === 0 || value === 1)) {
    // Check if this column should be a boolean
    const booleanColumns = ['isActive', 'isRevoked', 'isRegistrationComplete', 'isTwoFactorEnabled', 'isAdminLoginEnabled', 'isAdminDevice', 'biometricEnabled', 'isCompleted', 'spilled', 'isRepeatable'];
    if (booleanColumns.some(col => columnName.toLowerCase().includes(col.toLowerCase()))) {
      return value === 1;
    }
  }

  // Handle arrays (allowedIPs - SQLite simple-array stores as comma-separated or null)
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

  // Handle dates - SQLite datetime strings to Date objects
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return new Date(value);
  }

  return value;
}

async function importTable(client: Client, sqliteTableName: string, data: any[]): Promise<void> {
  if (data.length === 0) {
    console.log(`  Skipping ${sqliteTableName} (no data)`);
    return;
  }

  const pgTableName = TABLE_NAME_MAP[sqliteTableName] || sqliteTableName;
  console.log(`Importing ${sqliteTableName} -> ${pgTableName} (${data.length} rows)...`);

  // Get column mappings for this table
  const columnMap = COLUMN_MAP[sqliteTableName] || {};
  const skipColumns = SKIP_COLUMNS[sqliteTableName] || [];

  // Get column names from first row, map them, and filter out skipped columns
  const sqliteColumns = Object.keys(data[0]);
  const pgColumns = sqliteColumns
    .filter(col => !skipColumns.includes(col))
    .map(col => columnMap[col] || col);

  if (pgColumns.length === 0) {
    console.log(`  Skipping ${sqliteTableName} (no columns to import)`);
    return;
  }

  // Build INSERT query
  const placeholders = pgColumns.map((_, i) => `$${i + 1}`).join(', ');
  const columnNames = pgColumns.map(col => `"${col}"`).join(', ');
  const query = `INSERT INTO "${pgTableName}" (${columnNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;

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
      if (errors <= 5) { // Only log first 5 errors
        console.error(`  Error importing row:`, error.message);
        if (errors === 5) {
          console.error(`  ... (suppressing further errors for this table)`);
        }
      }
    }
  }

  console.log(`  ✅ Imported ${imported} rows, ${errors} errors`);
}

async function main() {
  console.log('Starting PostgreSQL data import...\n');

  // Check if export directory exists
  try {
    await fs.access(EXPORT_DIR);
  } catch (error) {
    console.error(`Error: Export directory not found at ${EXPORT_DIR}`);
    console.error('Please run export-sqlite.ts first');
    process.exit(1);
  }

  // Load exported data
  const allDataPath = path.join(EXPORT_DIR, 'all-data.json');
  let allData: Record<string, any[]>;
  try {
    const fileContent = await fs.readFile(allDataPath, 'utf-8');
    allData = JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error reading export file: ${error}`);
    process.exit(1);
  }

  // Connect to PostgreSQL
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database\n');

    // Import tables in dependency order
    for (const sqliteTableName of IMPORT_ORDER) {
      if (allData[sqliteTableName]) {
        await importTable(client, sqliteTableName, allData[sqliteTableName]);
      }
    }

    console.log('\n✅ Import complete!');
  } catch (error) {
    console.error('Error during import:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch(console.error);
