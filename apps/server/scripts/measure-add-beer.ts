/**
 * Measure add-beer performance (EventBeersService.create).
 *
 * Bootstraps the Nest app, creates a test user + event, runs create() N times,
 * reports min/max/avg/p95 ms, then cleans up. Use for before/after comparison
 * when optimizing (e.g. defer achievements, emit after writes, remove duplicate fetches).
 *
 * Usage (from apps/server):
 *   pnpm run measure:add-beer
 *   RUNS=10 pnpm run measure:add-beer
 *
 * Requires: DATABASE_URL. Set SKIP_PERF_TESTS=1 to no-op (for CI).
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { EventBeersService } from '../src/events/services/event-beers.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { Gender } from '@prisma/client';

const RUNS = Number(process.env.RUNS) || 5;
const SKIP = process.env.SKIP_PERF_TESTS === '1' || !process.env.DATABASE_URL;

function roundMs(ms: number): number {
  return Math.round(ms * 100) / 100;
}

function stats(
  durations: number[],
): { min: number; max: number; avg: number; p95: number } {
  const sorted = [...durations].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const p95Index = Math.min(
    Math.ceil(sorted.length * 0.95) - 1,
    sorted.length - 1,
  );
  return {
    min: roundMs(sorted[0]!),
    max: roundMs(sorted[sorted.length - 1]!),
    avg: roundMs(sum / sorted.length),
    p95: roundMs(sorted[p95Index] ?? sorted[0]!),
  };
}

async function main() {
  if (SKIP) {
    console.log(
      'Add-beer measurement skipped (SKIP_PERF_TESTS=1 or no DATABASE_URL)',
    );
    return;
  }

  const app = await NestFactory.create(AppModule, { logger: false });
  const eventBeersService = app.get(EventBeersService);
  const prisma = app.get(PrismaService);

  const start = new Date();
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  const user = await prisma.user.create({
    data: {
      username: `perf-user-${Date.now()}`,
      gender: Gender.MALE,
      role: 'PARTICIPANT',
      canLogin: true,
    },
  });
  const userId = user.id;

  const event = await prisma.event.create({
    data: {
      name: `Perf event ${Date.now()}`,
      startDate: start,
      endDate: end,
      isActive: true,
    },
  });
  const eventId = event.id;

  await prisma.eventUsers.create({ data: { eventId, userId } });

  const durations: number[] = [];
  for (let i = 0; i < RUNS; i++) {
    const t0 = performance.now();
    await eventBeersService.create(
      eventId,
      userId,
      undefined,
      undefined,
      false,
      'LARGE',
      0.5,
    );
    durations.push(performance.now() - t0);
  }

  const s = stats(durations);
  console.log('\n--- Add beer performance ---');
  console.log(`Runs: ${RUNS}`);
  console.log(`Min:  ${s.min} ms`);
  console.log(`Max:  ${s.max} ms`);
  console.log(`Avg:  ${s.avg} ms`);
  console.log(`P95:  ${s.p95} ms`);
  console.log('----------------------------\n');

  // Cleanup
  await prisma.eventBeer.deleteMany({ where: { eventId, userId } });
  await prisma.beer.deleteMany({ where: { userId } });
  await prisma.eventUsers.deleteMany({ where: { eventId, userId } });
  await prisma.event.deleteMany({ where: { id: eventId } });
  await prisma.user.deleteMany({ where: { id: userId } });
  await app.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
