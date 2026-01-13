import { parse } from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

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
  try {
    console.log('🔄 Starting database refresh from production to development...');
    console.log('📦 Dumping production database...');

    // Dump production database
    // --clean: include DROP statements
    // --if-exists: use IF EXISTS for DROP statements
    // --no-owner: don't set ownership (useful for different users)
    // --no-privileges: don't dump access privileges
    const dumpCommand = `pg_dump "${prodDatabaseUrl}" --clean --if-exists --no-owner --no-privileges -f "${dumpFile}"`;
    
    await execAsync(dumpCommand);
    console.log('✅ Production database dumped successfully');

    console.log('🗑️  Clearing development database...');
    
    // Restore to development database
    // The --clean flag in pg_dump already includes DROP statements
    const restoreCommand = `psql "${devDatabaseUrl}" -f "${dumpFile}"`;
    
    await execAsync(restoreCommand);
    console.log('✅ Development database restored successfully');

    // Clean up dump file
    if (fs.existsSync(dumpFile)) {
      fs.unlinkSync(dumpFile);
      console.log('🧹 Temporary dump file cleaned up');
    }

    console.log('🎉 Database refresh completed successfully!');
  } catch (error: any) {
    console.error('❌ Error during database refresh:', error.message);
    if (error.stderr) {
      console.error('Error details:', error.stderr);
    }
    
    // Clean up dump file on error
    if (fs.existsSync(dumpFile)) {
      fs.unlinkSync(dumpFile);
    }
    
    process.exit(1);
  }
}

main();
