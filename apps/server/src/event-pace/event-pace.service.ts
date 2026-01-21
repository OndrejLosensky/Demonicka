import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { eventPaceQuery } from './queries/eventPaceQuery';

type EventPace = import('@demonicka/shared-types').EventPace;

type EventPaceRow = {
  asOf: Date;
  sleepGapMinutes: number;
  windowMinutes: number;
  totalNonSpilledBeers: number;
  sessions: number;
  activeHours: number;
  avgBeersPerActiveHour: number | null;
  beersLastWindow: number;
  currentBeersPerHour: number;
};

@Injectable()
export class EventPaceService {
  private readonly SLEEP_GAP_MINUTES = 90;
  private readonly WINDOW_MINUTES = 60;

  constructor(private readonly prisma: PrismaService) {}

  async getForEvent(eventId: string): Promise<EventPace> {
    const rows = await this.prisma.$queryRaw<EventPaceRow[]>(
      eventPaceQuery({
        eventId,
        sleepGapMinutes: this.SLEEP_GAP_MINUTES,
        windowMinutes: this.WINDOW_MINUTES,
      }),
    );

    const row = rows?.[0];
    // The query always returns a row; keep this defensive anyway.
    if (!row) {
      return {
        asOf: new Date().toISOString(),
        sleepGapMinutes: this.SLEEP_GAP_MINUTES,
        windowMinutes: this.WINDOW_MINUTES,
        totalNonSpilledBeers: 0,
        sessions: 0,
        activeHours: 0,
        avgBeersPerActiveHour: null,
        beersLastWindow: 0,
        currentBeersPerHour: 0,
      };
    }

    return {
      asOf: row.asOf.toISOString(),
      sleepGapMinutes: row.sleepGapMinutes,
      windowMinutes: row.windowMinutes,
      totalNonSpilledBeers: row.totalNonSpilledBeers,
      sessions: row.sessions,
      activeHours: row.activeHours,
      avgBeersPerActiveHour: row.avgBeersPerActiveHour,
      beersLastWindow: row.beersLastWindow,
      currentBeersPerHour: row.currentBeersPerHour,
    };
  }
}

