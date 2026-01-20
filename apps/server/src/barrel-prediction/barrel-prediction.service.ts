import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { barrelPredictionQuery } from './queries/barrelPredictionQuery';

type PredictionRow = {
  eventId: string;
  asOf: Date;

  barrelId: string;
  barrelOrderNumber: number;
  barrelSize: number;
  barrelTotalBeers: number;
  barrelRemainingBeers: number;
  barrelCreatedAt: Date;

  windowMinutes: number;
  rollingFrom: Date;
  rollingTo: Date;

  fromStartConsumed: number;
  fromStartHoursElapsed: number;

  rollingConsumed: number;
  rollingHoursElapsed: number;

  previousEventId: string | null;
  previousMatchBeersPerHour: number | null;
  previousAvgBeersPerHour: number | null;
  previousFullBarrelsUsed: number | null;
};

type BarrelPrediction = import('@demonicka/shared-types').BarrelPrediction;

@Injectable()
export class BarrelPredictionService {
  // Defaults (can be moved to config/env later)
  private readonly WINDOW_MINUTES = 60;
  private readonly MIN_CONSUMED = 5;
  private readonly MIN_ELAPSED_MINUTES = 15;

  constructor(private readonly prisma: PrismaService) {}

  async getForEvent(eventId: string): Promise<BarrelPrediction | undefined> {
    const rows = await this.prisma.$queryRaw<PredictionRow[]>(
      barrelPredictionQuery({
        eventId,
        windowMinutes: this.WINDOW_MINUTES,
      }),
    );

    const row = rows?.[0];
    if (!row) return undefined;

    const asOfIso = row.asOf.toISOString();
    const barrelCreatedAtIso = row.barrelCreatedAt.toISOString();

    const fromStartBph =
      row.fromStartHoursElapsed > 0
        ? row.fromStartConsumed / row.fromStartHoursElapsed
        : null;
    const rollingBph =
      row.rollingHoursElapsed > 0 ? row.rollingConsumed / row.rollingHoursElapsed : null;

    const rollingElapsedMinutes = row.rollingHoursElapsed * 60;
    const fromStartElapsedMinutes = row.fromStartHoursElapsed * 60;

    const rollingHasSignal =
      row.rollingConsumed >= this.MIN_CONSUMED &&
      rollingElapsedMinutes >= this.MIN_ELAPSED_MINUTES;
    const fromStartHasSignal =
      row.fromStartConsumed >= this.MIN_CONSUMED &&
      fromStartElapsedMinutes >= this.MIN_ELAPSED_MINUTES;

    const methodUsed = rollingHasSignal
      ? 'rolling_window'
      : fromStartHasSignal
        ? 'from_start'
        : 'rolling_window';

    const currentBph =
      methodUsed === 'rolling_window'
        ? rollingHasSignal
          ? rollingBph
          : null
        : fromStartHasSignal
          ? fromStartBph
          : null;

    const prevFullUsed = row.previousFullBarrelsUsed ?? 0;
    const prevBph =
      row.previousMatchBeersPerHour ??
      row.previousAvgBeersPerHour ??
      null;
    const matchingStrategy =
      row.previousMatchBeersPerHour != null
        ? 'same_index_size'
        : row.previousAvgBeersPerHour != null
          ? 'avg_same_size'
          : null;

    const emptyAtByCurrent =
      currentBph && currentBph > 0
        ? new Date(row.asOf.getTime() + (row.barrelRemainingBeers / currentBph) * 3600_000).toISOString()
        : null;

    const emptyAtByHistorical =
      prevBph && prevBph > 0
        ? new Date(row.asOf.getTime() + (row.barrelRemainingBeers / prevBph) * 3600_000).toISOString()
        : null;

    const status: BarrelPrediction['status'] =
      !currentBph
        ? 'warming_up'
        : !prevBph
          ? 'no_history'
          : 'ok';

    return {
      asOf: asOfIso,
      status,
      barrel: {
        id: row.barrelId,
        orderNumber: row.barrelOrderNumber,
        size: row.barrelSize,
        totalBeers: row.barrelTotalBeers,
        remainingBeers: row.barrelRemainingBeers,
        createdAt: barrelCreatedAtIso,
      },
      current: {
        methodUsed,
        windowMinutes: row.windowMinutes,
        minConsumed: this.MIN_CONSUMED,
        minElapsedMinutes: this.MIN_ELAPSED_MINUTES,
        fromStart: {
          startedAt: barrelCreatedAtIso,
          consumed: row.fromStartConsumed,
          hoursElapsed: row.fromStartHoursElapsed,
          beersPerHour: fromStartBph,
        },
        rollingWindow: {
          from: row.rollingFrom.toISOString(),
          to: row.rollingTo.toISOString(),
          consumed: row.rollingConsumed,
          hoursElapsed: row.rollingHoursElapsed,
          beersPerHour: rollingBph,
        },
      },
      historical: {
        previousEventId: row.previousEventId,
        matchingStrategy,
        fullBarrelsUsed: prevFullUsed,
        beersPerHour: prevBph,
      },
      eta: {
        emptyAtByCurrent,
        emptyAtByHistorical,
      },
    };
  }
}

