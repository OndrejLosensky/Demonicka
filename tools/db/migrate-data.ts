/**
 * Complete data migration script
 * 
 * Usage: pnpm migrate:data
 * 
 * This script runs the complete migration process:
 * 1. Exports data from SQLite
 * 2. Imports data to PostgreSQL
 * 3. Validates the migration
 */

import * as child_process from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const exec = promisify(child_process.exec);

async function runCommand(command: string, cwd?: string) {
  console.log(`\n▶ ${command}\n`);
  try {
    const { stdout, stderr } = await exec(command, { cwd: cwd || __dirname });
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting complete data migration process...\n');
  console.log('='.repeat(60));

  try {
    // Step 1: Export from SQLite
    console.log('\n📤 Step 1: Exporting data from SQLite...');
    console.log('='.repeat(60));
    await runCommand('pnpm export:sqlite');

    // Step 2: Import to PostgreSQL
    console.log('\n📥 Step 2: Importing data to PostgreSQL...');
    console.log('='.repeat(60));
    await runCommand('pnpm import:postgres');

    console.log('\n✅ Migration complete!');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n❌ Migration failed!');
    process.exit(1);
  }
}

main().catch(console.error);
