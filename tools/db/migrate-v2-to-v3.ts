/**
 * Migration script to upgrade database from v2 (production) to v3 (current)
 * 
 * This handles:
 * - Adding canLogin column to User table
 * - Adding createdBy columns to User and Event tables
 * - Updating UserRole enum (ADMIN -> OPERATOR, adding SUPER_ADMIN)
 * - Removing deprecated isAdminLoginEnabled column
 * - Adding any missing beer pong tables/columns
 * 
 * This script is idempotent - safe to run multiple times.
 */

import { parse } from 'dotenv';
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load database URL from .env.dev (can be overridden)
const devEnvPath = path.join(__dirname, '.env.dev');
let databaseUrl: string | undefined;

if (fs.existsSync(devEnvPath)) {
  const devEnvContent = fs.readFileSync(devEnvPath, 'utf-8');
  const devEnv = parse(devEnvContent);
  databaseUrl = devEnv.DATABASE_URL;
}

// Allow override via command line argument or env var
const targetDbUrl = process.argv[2] || process.env.DATABASE_URL || databaseUrl;

if (!targetDbUrl) {
  console.error('Error: DATABASE_URL not found. Provide it as argument or in .env.dev');
  process.exit(1);
}

async function checkColumnExists(client: Client, tableName: string, columnName: string): Promise<boolean> {
  const result = await client.query(`
    SELECT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = $1 
      AND column_name = $2
    )
  `, [tableName, columnName]);
  return result.rows[0].exists;
}

async function checkTableExists(client: Client, tableName: string): Promise<boolean> {
  const result = await client.query(`
    SELECT EXISTS (
      SELECT 1 
      FROM information_schema.tables 
      WHERE table_name = $1
    )
  `, [tableName]);
  return result.rows[0].exists;
}

async function checkEnumValueExists(client: Client, enumName: string, enumValue: string): Promise<boolean> {
  const result = await client.query(`
    SELECT EXISTS (
      SELECT 1 
      FROM pg_enum 
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
      WHERE pg_type.typname = $1 
      AND pg_enum.enumlabel = $2
    )
  `, [enumName, enumValue]);
  return result.rows[0].exists;
}

async function migrate() {
  const client = new Client({ connectionString: targetDbUrl });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Start transaction for safety
    await client.query('BEGIN');

    console.log('🔍 Checking current schema state...\n');

    // Step 1: Update UserRole enum (ADMIN -> OPERATOR, add SUPER_ADMIN)
    const hasSuperAdmin = await checkEnumValueExists(client, 'UserRole', 'SUPER_ADMIN');
    const hasOperator = await checkEnumValueExists(client, 'UserRole', 'OPERATOR');
    const hasAdmin = await checkEnumValueExists(client, 'UserRole', 'ADMIN');

    if (hasAdmin && (!hasSuperAdmin || !hasOperator)) {
      console.log('📝 Migrating UserRole enum (ADMIN -> OPERATOR, adding SUPER_ADMIN)...');
      
      // Create new enum type
      await client.query(`CREATE TYPE "UserRole_new" AS ENUM ('SUPER_ADMIN', 'OPERATOR', 'USER', 'PARTICIPANT')`);
      
      // Remove default temporarily
      await client.query(`ALTER TABLE "User" ALTER COLUMN role DROP DEFAULT`);
      
      // Convert enum values
      await client.query(`
        ALTER TABLE "User" ALTER COLUMN role TYPE "UserRole_new" USING (
          CASE role::text
            WHEN 'ADMIN' THEN 'OPERATOR'::"UserRole_new"
            WHEN 'USER' THEN 'USER'::"UserRole_new"
            WHEN 'PARTICIPANT' THEN 'PARTICIPANT'::"UserRole_new"
            ELSE 'PARTICIPANT'::"UserRole_new"
          END
        )
      `);
      
      // Restore default
      await client.query(`ALTER TABLE "User" ALTER COLUMN role SET DEFAULT 'PARTICIPANT'::"UserRole_new"`);
      
      // Drop old enum and rename new one
      await client.query(`DROP TYPE "UserRole"`);
      await client.query(`ALTER TYPE "UserRole_new" RENAME TO "UserRole"`);
      
      console.log('   ✅ UserRole enum migrated\n');
    } else if (hasSuperAdmin && hasOperator) {
      console.log('   ✅ UserRole enum already up to date\n');
    }

    // Step 2: Add canLogin column to User
    const hasCanLogin = await checkColumnExists(client, 'User', 'canLogin');
    if (!hasCanLogin) {
      console.log('📝 Adding canLogin column to User table...');
      
      await client.query(`
        ALTER TABLE "User" 
        ADD COLUMN "canLogin" BOOLEAN NOT NULL DEFAULT true
      `);
      
      // Set canLogin based on role (PARTICIPANT = false, others = true)
      await client.query(`UPDATE "User" SET "canLogin" = false WHERE role = 'PARTICIPANT'`);
      await client.query(`UPDATE "User" SET "canLogin" = true WHERE role != 'PARTICIPANT'`);
      
      console.log('   ✅ canLogin column added\n');
    } else {
      console.log('   ✅ canLogin column already exists\n');
    }

    // Step 3: Add createdBy column to User
    const userHasCreatedBy = await checkColumnExists(client, 'User', 'createdBy');
    if (!userHasCreatedBy) {
      console.log('📝 Adding createdBy column to User table...');
      
      await client.query(`
        ALTER TABLE "User" 
        ADD COLUMN "createdBy" UUID
      `);
      
      // Add foreign key constraint
      await client.query(`
        ALTER TABLE "User" 
        ADD CONSTRAINT "User_createdBy_fkey" 
        FOREIGN KEY ("createdBy") REFERENCES "User"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE
      `);
      
      // Add index
      await client.query(`CREATE INDEX IF NOT EXISTS "User_createdBy_idx" ON "User"("createdBy")`);
      
      console.log('   ✅ createdBy column added to User\n');
    } else {
      console.log('   ✅ createdBy column already exists in User\n');
    }

    // Step 4: Add createdBy column to Event
    const eventHasCreatedBy = await checkColumnExists(client, 'Event', 'createdBy');
    if (!eventHasCreatedBy) {
      console.log('📝 Adding createdBy column to Event table...');
      
      await client.query(`
        ALTER TABLE "Event" 
        ADD COLUMN "createdBy" UUID
      `);
      
      // Add foreign key constraint
      await client.query(`
        ALTER TABLE "Event" 
        ADD CONSTRAINT "Event_createdBy_fkey" 
        FOREIGN KEY ("createdBy") REFERENCES "User"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE
      `);
      
      // Add index
      await client.query(`CREATE INDEX IF NOT EXISTS "Event_createdBy_idx" ON "Event"("createdBy")`);
      
      console.log('   ✅ createdBy column added to Event\n');
    } else {
      console.log('   ✅ createdBy column already exists in Event\n');
    }

    // Step 5: Remove deprecated isAdminLoginEnabled column
    const hasIsAdminLoginEnabled = await checkColumnExists(client, 'User', 'isAdminLoginEnabled');
    if (hasIsAdminLoginEnabled) {
      console.log('📝 Removing deprecated isAdminLoginEnabled column...');
      
      await client.query(`ALTER TABLE "User" DROP COLUMN IF EXISTS "isAdminLoginEnabled"`);
      
      console.log('   ✅ isAdminLoginEnabled column removed\n');
    } else {
      console.log('   ✅ isAdminLoginEnabled column already removed\n');
    }

    // Commit column changes transaction
    await client.query('COMMIT');
    console.log('✅ Column migrations completed\n');

    // Step 6: Run Prisma migrations to create missing tables (Role, Permission, FeatureFlag, BeerPong, etc.)
    console.log('🔄 Running Prisma migrations to create missing tables...');
    const serverDir = path.join(__dirname, '../../apps/server');
    
    if (fs.existsSync(serverDir)) {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      
      try {
        // Try migrate deploy first (for production-like environments)
        try {
          await execAsync(`cd "${serverDir}" && npx prisma migrate deploy`);
          console.log('   ✅ Prisma migrations applied\n');
        } catch (deployError: any) {
          // If deploy fails (e.g., no migration history), try migrate dev
          console.log('   ⚠️  migrate deploy failed, trying migrate dev...');
          await execAsync(`cd "${serverDir}" && npx prisma migrate dev --skip-seed --skip-generate`);
          console.log('   ✅ Prisma migrations applied\n');
        }
        
        // Verify critical tables were created
        const hasRole = await checkTableExists(client, 'Role');
        const hasBeerPongEvent = await checkTableExists(client, 'BeerPongEvent');
        const hasPermission = await checkTableExists(client, 'Permission');
        
        if (hasRole && hasPermission) {
          console.log('   ✅ Role and Permission tables created\n');
        } else {
          console.log('   ⚠️  Some tables may still be missing\n');
        }
        
        if (hasBeerPongEvent) {
          console.log('   ✅ Beer pong tables created\n');
        }
      } catch (migrateError: any) {
        console.error(`   ❌ Could not apply Prisma migrations: ${migrateError.message}`);
        if (migrateError.stderr) {
          console.error(migrateError.stderr);
        }
        console.log('   ⚠️  You may need to run migrations manually: cd apps/server && npx prisma migrate deploy\n');
      }
    } else {
      console.log('   ⚠️  Server directory not found, skipping Prisma migrations\n');
    }

    // Regenerate Prisma client if in dev mode
    if (fs.existsSync(serverDir)) {
      console.log('🔄 Regenerating Prisma client...');
      const { exec: execGenerate } = await import('child_process');
      const { promisify: promisifyGenerate } = await import('util');
      const execAsyncGenerate = promisifyGenerate(execGenerate);
      
      try {
        await execAsyncGenerate(`cd "${serverDir}" && npx prisma generate`);
        console.log('✅ Prisma client regenerated\n');
      } catch (error: any) {
        console.warn(`⚠️  Could not regenerate Prisma client: ${error.message}\n`);
      }
    }

    console.log('🎉 All done!');
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate().catch(console.error);
