/**
 * Backup PostgreSQL databases
 * 
 * Usage: pnpm backup
 *        pnpm backup:prod
 *        pnpm backup:dev
 * 
 * Creates timestamped SQL dumps of databases
 */

import { parse } from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load database URLs
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

// Create backups directory
const backupsDir = path.join(__dirname, 'backups');
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

async function backupDatabase(databaseUrl: string, label: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                    new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('.')[0];
  const dbName = databaseUrl.split('/').pop()?.split('?')[0] || 'unknown';
  const backupFile = path.join(backupsDir, `${dbName}_${timestamp}.sql`);
  
  console.log(`📦 Backing up ${label}...`);
  
  try {
    const dumpCommand = `pg_dump "${databaseUrl}" --clean --if-exists --no-owner --no-privileges -f "${backupFile}"`;
    await execAsync(dumpCommand);
    
    const stats = fs.statSync(backupFile);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`✅ ${label} backed up successfully`);
    console.log(`   File: ${path.basename(backupFile)}`);
    console.log(`   Size: ${fileSizeMB} MB\n`);
    
    return backupFile;
  } catch (error: any) {
    console.error(`❌ Error backing up ${label}:`, error.message);
    if (error.stderr) {
      console.error('Error details:', error.stderr);
    }
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const backupType = args[0] || 'both'; // 'prod', 'dev', or 'both'
  
  console.log('💾 Starting database backup...\n');
  
  try {
    if (backupType === 'prod' || backupType === 'both') {
      await backupDatabase(prodDatabaseUrl, 'Production');
    }
    
    if (backupType === 'dev' || backupType === 'both') {
      await backupDatabase(devDatabaseUrl, 'Development');
    }
    
    console.log('🎉 Backup completed successfully!');
    console.log(`\nBackups stored in: ${backupsDir}`);
  } catch (error) {
    console.error('\n❌ Backup failed!');
    process.exit(1);
  }
}

main();
