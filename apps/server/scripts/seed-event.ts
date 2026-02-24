/*
 * Seed an event with test data: event users, barrels, event beers (over 2 days),
 * beer pong tournament with teams and games.
 *
 * Usage: npm run seed:event <eventId>
 * Or:    npx ts-node scripts/seed-event.ts <eventId>
 *
 * Prerequisites:
 * - Event must already exist (create it in the app first).
 * - Replace the USER_IDS below with real user UUIDs from your DB (need at least 16 for full beer pong bracket: 8 teams).
 */

import { PrismaClient, Prisma, BeerPongRound, BeerPongGameStatus, BeerPongEventStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { config } from 'dotenv';
import { resolve } from 'path';
import { addHours, subHours } from 'date-fns';

config({ path: resolve(__dirname, '../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// --- Predefined user IDs --- (Test users only!!! Not for production!!!)
const USER_IDS: string[] = [
  "fa0148ab-0c62-4a4e-a7c9-f8776e900e6a",
  "6cf2366f-c62f-4ea3-88be-24d79f161c07",
  "62b7c4ff-4ba2-4e63-a775-748b14680444",
  "e365cd55-7e87-45e4-9d15-cf881d72b2c1",
  "20902e6f-e2cc-4275-8e1b-32ed7e735a71",
  "00607374-df02-44b7-affb-0db8ddda4fcc",
  "52e9444a-f7df-4538-9793-f2a86d1d3fd4",
  "d1319cb9-dff1-45a0-b3b6-f2e423ad75a6",
  "d6844d1d-b3cd-487f-a633-b6531ff28b1e",
  "9f54cf62-fc24-405e-8088-560de217f15a",
  "1f254720-3a13-4122-be87-20d2c414d25b",
  "d55c887f-d2d4-4216-a396-ad046d9c8e95",
  "eb3fa8fa-87ad-4745-a20d-24678f984ec9",
  "97f1f445-a789-46b7-8a0e-e0a1f70ebc98",
  "45756535-4ef0-40f9-832e-cf5ee9bdfe9d",
  "0503b25e-3790-4617-ad17-e25fdb0578eb"
]
/** Beers per user over the 2 days: random in [min, max] (inclusive). */
const BEERS_PER_USER_MIN = 8;
const BEERS_PER_USER_MAX = 32;
const BARREL_SIZE = 30 as const; // litres
const BEER_VOLUME = 0.5;

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seedEvent(eventId: string) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, deletedAt: null },
  });
  if (!event) {
    throw new Error(`Event not found or deleted: ${eventId}`);
  }

  const userIds = USER_IDS.filter(Boolean);
  if (userIds.length < 2) {
    throw new Error('At least 2 USER_IDS must be set in the script.');
  }

  const day1Start = event.startDate;
  const day1End = addHours(day1Start, 12);
  const day2Start = addHours(day1Start, 24);
  const day2End = addHours(day2Start, 12);

  console.log(`Seeding event "${event.name}" (${eventId})`);
  console.log(`  Users: ${userIds.length}, Days: ${day1Start.toISOString()} -> ${day2End.toISOString()}`);

  // 1) Barrels for the event
  const maxOrder = await prisma.barrel.findFirst({ orderBy: { orderNumber: 'desc' }, select: { orderNumber: true } });
  const orderStart = (maxOrder?.orderNumber ?? 0) + 1;
  const barrel1 = await prisma.barrel.create({
    data: {
      size: BARREL_SIZE,
      isActive: false,
      orderNumber: orderStart,
      remainingBeers: BARREL_SIZE,
      totalBeers: BARREL_SIZE,
      remainingLitres: new Prisma.Decimal(BARREL_SIZE),
      totalLitres: new Prisma.Decimal(BARREL_SIZE),
    },
  });
  const barrel2 = await prisma.barrel.create({
    data: {
      size: BARREL_SIZE,
      isActive: false,
      orderNumber: orderStart + 1,
      remainingBeers: BARREL_SIZE,
      totalBeers: BARREL_SIZE,
      remainingLitres: new Prisma.Decimal(BARREL_SIZE),
      totalLitres: new Prisma.Decimal(BARREL_SIZE),
    },
  });
  const barrelIds = [barrel1.id, barrel2.id];
  await prisma.eventBarrels.createMany({
    data: barrelIds.map((barrelId) => ({ eventId, barrelId })),
  });
  console.log(`  Created 2 barrels and linked to event`);

  // 2) Event users
  await prisma.eventUsers.createMany({
    data: userIds.map((userId) => ({ eventId, userId })),
    skipDuplicates: true,
  });
  console.log(`  Linked ${userIds.length} users to event`);

  // 3) Event beers over 2 days: 8–32 per user (random), spread across the 2 days
  const eventBeers: { id: string; eventId: string; userId: string; barrelId: string | null; consumedAt: Date; volumeLitres: number }[] = [];
  const day1Ms = day1End.getTime() - day1Start.getTime();
  const day2Ms = day2End.getTime() - day2Start.getTime();
  for (const userId of userIds) {
    const count = randomInt(BEERS_PER_USER_MIN, BEERS_PER_USER_MAX);
    for (let i = 0; i < count; i++) {
      const day = Math.random() < 0.5 ? 0 : 1;
      const dayStart = day === 0 ? day1Start : day2Start;
      const dayMs = day === 0 ? day1Ms : day2Ms;
      const t = dayStart.getTime() + Math.random() * dayMs;
      const consumedAt = new Date(t);
      const barrelId = Math.random() > 0.5 ? pick(barrelIds) : null;
      const id = crypto.randomUUID();
      eventBeers.push({
        id,
        eventId,
        userId,
        barrelId,
        consumedAt,
        volumeLitres: BEER_VOLUME,
      });
    }
  }
  await prisma.eventBeer.createMany({
    data: eventBeers.map((b) => ({
      id: b.id,
      eventId: b.eventId,
      userId: b.userId,
      barrelId: b.barrelId,
      consumedAt: b.consumedAt,
      volumeLitres: b.volumeLitres,
      beerSize: 'LARGE',
      spilled: false,
    })),
  });
  // Decrement barrel remaining (script only inserts, so we update barrels manually)
  for (const barrelId of barrelIds) {
    const count = eventBeers.filter((b) => b.barrelId === barrelId).length;
    if (count === 0) continue;
    const barrel = await prisma.barrel.findUnique({ where: { id: barrelId } });
    if (!barrel) continue;
    const remBeers = Math.max(0, barrel.remainingBeers - count);
    const remLitres = Math.max(0, Number(barrel.remainingLitres) - count * BEER_VOLUME);
    await prisma.barrel.update({
      where: { id: barrelId },
      data: {
        remainingBeers: remBeers,
        remainingLitres: new Prisma.Decimal(remLitres),
      },
    });
  }
  console.log(`  Created ${eventBeers.length} event beers over 2 days`);

  // 4) Beer pong (only if we have at least 16 users for 8 teams)
  if (userIds.length < 16) {
    console.log(`  Skipping beer pong (need 16 users for 8 teams; you have ${userIds.length})`);
    return;
  }

  const bpEvent = await prisma.beerPongEvent.create({
    data: {
      eventId,
      name: `Test tournament – ${event.name}`,
      status: BeerPongEventStatus.COMPLETED,
      beersPerPlayer: 2,
      timeWindowMinutes: 5,
      undoWindowMinutes: 5,
      cancellationPolicy: 'KEEP_BEERS',
      beerSize: 'LARGE',
      beerVolumeLitres: new Prisma.Decimal(0.5),
      startedAt: day1Start,
      completedAt: day2End,
    },
  });

  // 5) Event-level teams (8 teams = 16 users)
  const teamPairs: [string, string][] = [
    [userIds[0], userIds[1]],
    [userIds[2], userIds[3]],
    [userIds[4], userIds[5]],
    [userIds[6], userIds[7]],
    [userIds[8], userIds[9]],
    [userIds[10], userIds[11]],
    [userIds[12], userIds[13]],
    [userIds[14], userIds[15]],
  ];
  const eventTeamNames = [
    'Team Alpha', 'Team Beta', 'Team Gamma', 'Team Delta',
    'Team Echo', 'Team Foxtrot', 'Team Golf', 'Team Hotel',
  ];
  const eventTeams = await Promise.all(
    teamPairs.map(([p1, p2], i) =>
      prisma.eventBeerPongTeam.create({
        data: {
          eventId,
          name: eventTeamNames[i],
          player1Id: p1,
          player2Id: p2,
        },
      })
    )
  );

  // 6) Beer pong teams (linked to event teams)
  const bpTeams = await Promise.all(
    eventTeams.map((et) =>
      prisma.beerPongTeam.create({
        data: {
          beerPongEventId: bpEvent.id,
          eventBeerPongTeamId: et.id,
          name: et.name,
          player1Id: et.player1Id,
          player2Id: et.player2Id,
        },
      })
    )
  );
  const [t1, t2, t3, t4, t5, t6, t7, t8] = bpTeams;

  // 7) Bracket: 4 QF (t1..t8), 2 SF (winners), 1 F
  const now = new Date();
  const qf1 = await prisma.beerPongGame.create({
    data: {
      beerPongEventId: bpEvent.id,
      round: BeerPongRound.QUARTERFINAL,
      team1Id: t1.id,
      team2Id: t2.id,
      winnerTeamId: t1.id,
      status: BeerPongGameStatus.COMPLETED,
      startedAt: subHours(now, 5),
      endedAt: subHours(now, 4),
      durationSeconds: 600,
    },
  });
  const qf2 = await prisma.beerPongGame.create({
    data: {
      beerPongEventId: bpEvent.id,
      round: BeerPongRound.QUARTERFINAL,
      team1Id: t3.id,
      team2Id: t4.id,
      winnerTeamId: t3.id,
      status: BeerPongGameStatus.COMPLETED,
      startedAt: subHours(now, 5),
      endedAt: subHours(now, 4),
      durationSeconds: 600,
    },
  });
  const qf3 = await prisma.beerPongGame.create({
    data: {
      beerPongEventId: bpEvent.id,
      round: BeerPongRound.QUARTERFINAL,
      team1Id: t5.id,
      team2Id: t6.id,
      winnerTeamId: t5.id,
      status: BeerPongGameStatus.COMPLETED,
      startedAt: subHours(now, 5),
      endedAt: subHours(now, 4),
      durationSeconds: 600,
    },
  });
  const qf4 = await prisma.beerPongGame.create({
    data: {
      beerPongEventId: bpEvent.id,
      round: BeerPongRound.QUARTERFINAL,
      team1Id: t7.id,
      team2Id: t8.id,
      winnerTeamId: t7.id,
      status: BeerPongGameStatus.COMPLETED,
      startedAt: subHours(now, 5),
      endedAt: subHours(now, 4),
      durationSeconds: 600,
    },
  });
  const sf1 = await prisma.beerPongGame.create({
    data: {
      beerPongEventId: bpEvent.id,
      round: BeerPongRound.SEMIFINAL,
      team1Id: t1.id,
      team2Id: t3.id,
      winnerTeamId: t1.id,
      status: BeerPongGameStatus.COMPLETED,
      startedAt: subHours(now, 3),
      endedAt: subHours(now, 2),
      durationSeconds: 720,
    },
  });
  const sf2 = await prisma.beerPongGame.create({
    data: {
      beerPongEventId: bpEvent.id,
      round: BeerPongRound.SEMIFINAL,
      team1Id: t5.id,
      team2Id: t7.id,
      winnerTeamId: t5.id,
      status: BeerPongGameStatus.COMPLETED,
      startedAt: subHours(now, 3),
      endedAt: subHours(now, 2),
      durationSeconds: 720,
    },
  });
  const finalGame = await prisma.beerPongGame.create({
    data: {
      beerPongEventId: bpEvent.id,
      round: BeerPongRound.FINAL,
      team1Id: t1.id,
      team2Id: t5.id,
      winnerTeamId: t1.id,
      status: BeerPongGameStatus.COMPLETED,
      startedAt: subHours(now, 1),
      endedAt: now,
      durationSeconds: 900,
    },
  });

  // 8) Optional: link some event beers to games (BeerPongGameBeer)
  const someEventBeers = eventBeers.filter((b) => b.consumedAt >= day1Start && b.consumedAt <= day2End);
  const toLink = someEventBeers.slice(0, Math.min(6, someEventBeers.length));
  const games = [qf1, qf2, qf3, qf4, sf1, sf2, finalGame];
  for (let i = 0; i < toLink.length; i++) {
    const g = games[i % games.length];
    const b = toLink[i];
    await prisma.beerPongGameBeer.create({
      data: {
        beerPongGameId: g.id,
        userId: b.userId,
        eventBeerId: b.id,
      },
    }).catch(() => {});
  }

  console.log(`  Created beer pong event "${bpEvent.name}" with 8 teams, 7 games (4 QF / 2 SF / 1 F), and game beers`);
}

async function main() {
  const eventId = process.argv[2];
  if (!eventId) {
    console.error('Usage: npm run seed:event <eventId>');
    process.exit(1);
  }
  try {
    await seedEvent(eventId);
    console.log('Done.');
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
