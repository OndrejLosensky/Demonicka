/**
 * Export data from SQLite database to JSON files
 * 
 * Usage: pnpm export:sqlite
 * 
 * This script exports all data from the SQLite database to JSON files
 * that can be imported into PostgreSQL. It respects foreign key constraints
 * by exporting in the correct order.
 */

import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to SQLite database (relative to server directory)
const SQLITE_DB_PATH = path.join(__dirname, '../../apps/server/data/database.sqlite');
const OUTPUT_DIR = path.join(__dirname, 'exported-data');

// Tables in dependency order (parent tables first)
const TABLE_ORDER = [
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

interface QueryResult {
  [key: string]: any;
}

function openDatabase(dbPath: string): Promise<sqlite3.Database> {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(db);
      }
    });
  });
}

function dbAll(db: sqlite3.Database, sql: string): Promise<QueryResult[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows as QueryResult[]);
      }
    });
  });
}

function dbClose(db: sqlite3.Database): Promise<void> {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

async function exportTable(db: sqlite3.Database, tableName: string): Promise<QueryResult[]> {
  console.log(`Exporting table: ${tableName}`);
  try {
    const rows = await dbAll(db, `SELECT * FROM ${tableName}`);
    console.log(`  Exported ${rows.length} rows`);
    return rows;
  } catch (error: any) {
    if (error.message.includes('no such table')) {
      console.log(`  Table ${tableName} does not exist, skipping...`);
      return [];
    }
    throw error;
  }
}

async function main() {
  console.log('Starting SQLite data export...\n');

  // Check if SQLite database exists
  try {
    await fs.access(SQLITE_DB_PATH);
  } catch (error) {
    console.error(`Error: SQLite database not found at ${SQLITE_DB_PATH}`);
    process.exit(1);
  }

  // Create output directory
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  // Open database
  const db = await openDatabase(SQLITE_DB_PATH);

  try {
    const exportData: Record<string, QueryResult[]> = {};

    // Export each table
    for (const tableName of TABLE_ORDER) {
      const data = await exportTable(db, tableName);
      if (data.length > 0) {
        exportData[tableName] = data;
        
        // Also write individual JSON file for each table
        const filePath = path.join(OUTPUT_DIR, `${tableName}.json`);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      }
    }

    // Write combined export file
    const combinedPath = path.join(OUTPUT_DIR, 'all-data.json');
    await fs.writeFile(combinedPath, JSON.stringify(exportData, null, 2));

    console.log(`\n✅ Export complete! Data exported to: ${OUTPUT_DIR}`);
    console.log(`\nSummary:`);
    for (const [table, rows] of Object.entries(exportData)) {
      console.log(`  ${table}: ${rows.length} rows`);
    }
  } catch (error) {
    console.error('Error during export:', error);
    process.exit(1);
  } finally {
    await dbClose(db);
  }
}

main().catch(console.error);
