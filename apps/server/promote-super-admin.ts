import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '.env') });

// Create Prisma client with adapter (same as PrismaService)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function promoteToSuperAdmin(username: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      console.error(`User with username "${username}" not found`);
      process.exit(1);
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      console.log(`User "${username}" is already SUPER_ADMIN`);
      process.exit(0);
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        role: UserRole.SUPER_ADMIN,
        canLogin: true,
      },
    });

    console.log(`✅ Successfully promoted user "${username}" to SUPER_ADMIN`);
    console.log(`   User ID: ${updatedUser.id}`);
    console.log(`   Role: ${updatedUser.role}`);
    console.log(`   Can Login: ${updatedUser.canLogin}`);
  } catch (error) {
    console.error('Error promoting user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get username from command line argument
const username = process.argv[2];

if (!username) {
  console.error('Usage: ts-node promote-super-admin.ts <username>');
  process.exit(1);
}

promoteToSuperAdmin(username);
