/*
 * Create participant users (name + gender), same as the participants dialog.
 * No CLI params – edit PARTICIPANTS below and run.
 *
 * Usage: npm run seed:users
 * Or:    npx ts-node scripts/seed-users.ts
 *
 * After running, copy the printed user IDs into seed-event.ts USER_IDS if you use both scripts.
 */

import { PrismaClient, UserRole, Gender } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// --- What to create: name + gender (like AddParticipantModal). Edit this list. ---
const PARTICIPANTS: { name: string; gender: Gender }[] = [
  { name: 'AutoTest 01', gender: 'MALE' },
  { name: 'AutoTest 02', gender: 'FEMALE' },
  { name: 'AutoTest 03', gender: 'MALE' },
  { name: 'AutoTest 04', gender: 'FEMALE' },
  { name: 'AutoTest 05', gender: 'MALE' },
  { name: 'AutoTest 06', gender: 'FEMALE' },
  { name: 'AutoTest 07', gender: 'MALE' },
  { name: 'AutoTest 08', gender: 'FEMALE' },
  { name: 'AutoTest 09', gender: 'MALE' },
  { name: 'AutoTest 10', gender: 'FEMALE' },
  { name: 'AutoTest 11', gender: 'MALE' },
  { name: 'AutoTest 12', gender: 'FEMALE' },
  { name: 'AutoTest 13', gender: 'MALE' },
  { name: 'AutoTest 14', gender: 'FEMALE' },
  { name: 'AutoTest 15', gender: 'MALE' },
  { name: 'AutoTest 16', gender: 'FEMALE' },
];

function randomTokenSuffix(): number {
  return Math.floor(Math.random() * 9000) + 1000;
}

async function main() {
  if (PARTICIPANTS.length === 0) {
    console.error('PARTICIPANTS list is empty. Add at least one { name, gender } in the script.');
    process.exit(1);
  }

  const created: { id: string; name: string; gender: string; registrationToken: string }[] = [];

  for (const p of PARTICIPANTS) {
    const registrationToken = `${p.name}-${randomTokenSuffix()}`;
    const user = await prisma.user.create({
      data: {
        username: p.name,
        name: p.name,
        gender: p.gender,
        role: UserRole.PARTICIPANT,
        registrationToken,
        isRegistrationComplete: false,
        canLogin: false,
      },
    });
    created.push({
      id: user.id,
      name: user.name ?? p.name,
      gender: user.gender,
      registrationToken: user.registrationToken ?? registrationToken,
    });
  }

  console.log(`Created ${created.length} participant(s):\n`);
  for (const u of created) {
    console.log(`  ${u.name} (${u.gender})  id: ${u.id}  token: ${u.registrationToken}`);
  }
  console.log('\nCopy these IDs into seed-event.ts USER_IDS if you use both scripts:');
  console.log(
    JSON.stringify(
      created.map((u) => u.id),
      null,
      2
    )
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
