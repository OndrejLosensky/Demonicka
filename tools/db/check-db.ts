/**
 * Quick database connection checker
 * Shows which database you're connected to and some basic stats
 */

import { parse } from 'dotenv';
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check server .env
const serverEnvPath = path.join(__dirname, '../../apps/server/.env');
const serverEnvContent = fs.readFileSync(serverEnvPath, 'utf-8');
const serverEnv = parse(serverEnvContent);
const serverDbUrl = serverEnv.DATABASE_URL;

if (!serverDbUrl) {
  console.error('Error: DATABASE_URL not found in apps/server/.env');
  process.exit(1);
}

async function checkDatabase(databaseUrl: string, label: string) {
  const client = new Client({ connectionString: databaseUrl });
  
  try {
    await client.connect();
    
    // Get database name
    const dbResult = await client.query('SELECT current_database() as db_name');
    const dbName = dbResult.rows[0].db_name;
    
    // Get event count
    const eventResult = await client.query('SELECT COUNT(*) as count FROM "Event"');
    const eventCount = eventResult.rows[0].count;
    
    // Get latest events
    const eventsResult = await client.query(`
      SELECT name, "createdAt" 
      FROM "Event" 
      ORDER BY "createdAt" DESC 
      LIMIT 5
    `);
    
    console.log(`\n${label}:`);
    console.log(`  Database: ${dbName}`);
    console.log(`  Events: ${eventCount}`);
    console.log(`  Latest events:`);
    eventsResult.rows.forEach((event: any) => {
      console.log(`    - ${event.name} (${new Date(event.createdAt).toLocaleString()})`);
    });
    
  } catch (error: any) {
    console.error(`\n${label}: Error - ${error.message}`);
  } finally {
    await client.end();
  }
}

async function main() {
  console.log('🔍 Checking database connections...\n');
  
  // Check server database (what the app uses)
  await checkDatabase(serverDbUrl, '📦 Server App (apps/server/.env)');
  
  // Check prod database
  const prodEnvPath = path.join(__dirname, '.env.prod');
  if (fs.existsSync(prodEnvPath)) {
    const prodEnvContent = fs.readFileSync(prodEnvPath, 'utf-8');
    const prodEnv = parse(prodEnvContent);
    if (prodEnv.DATABASE_URL) {
      await checkDatabase(prodEnv.DATABASE_URL, '🏭 Production (tools/db/.env.prod)');
    }
  }
  
  // Check dev database
  const devEnvPath = path.join(__dirname, '.env.dev');
  if (fs.existsSync(devEnvPath)) {
    const devEnvContent = fs.readFileSync(devEnvPath, 'utf-8');
    const devEnv = parse(devEnvContent);
    if (devEnv.DATABASE_URL) {
      await checkDatabase(devEnv.DATABASE_URL, '🛠️  Development (tools/db/.env.dev)');
    }
  }
  
  console.log('\n✅ Done!\n');
}

main().catch(console.error);
