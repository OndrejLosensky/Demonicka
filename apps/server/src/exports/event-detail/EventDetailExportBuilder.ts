import { Injectable } from '@nestjs/common';
import type { StreamableFile } from '@nestjs/common';
import { DashboardService } from '../../dashboard/dashboard.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ExcelRenderer } from '../excel/ExcelRenderer';
import { EventDetailDataLoader } from './EventDetailDataLoader';
 
@Injectable()
export class EventDetailExportBuilder {
  constructor(
    private readonly loader: EventDetailDataLoader,
    private readonly dashboardService: DashboardService,
    private readonly prisma: PrismaService,
  ) {}
 
  async build(eventId: string): Promise<StreamableFile> {
    const data = await this.loader.load(eventId);
    const { event, users, barrels, beerLog, beerPongTeams, beerPongEvents } =
      data;
 
    const [dashboardStats, leaderboard, spilledCount] = await Promise.all([
      this.dashboardService.getDashboardStats(eventId),
      this.dashboardService.getLeaderboard(eventId),
      this.prisma.eventBeer.count({
        where: { eventId, spilled: true, deletedAt: null },
      }),
    ]);
 
    const renderer = new ExcelRenderer();
 
    // 1) Event
    renderer.addTableSheet({
      name: 'Event',
      columns: [
        { header: 'Field', key: 'field', width: 28, value: (r) => r.field },
        { header: 'Value', key: 'value', width: 60, value: (r) => r.value },
      ],
      rows: [
        { field: 'id', value: event.id },
        { field: 'name', value: event.name },
        { field: 'description', value: event.description ?? '' },
        { field: 'startDate', value: event.startDate },
        { field: 'endDate', value: event.endDate ?? null },
        { field: 'isActive', value: event.isActive },
        { field: 'createdBy', value: event.createdBy ?? '' },
        { field: 'createdAt', value: event.createdAt },
        { field: 'updatedAt', value: event.updatedAt },
        { field: 'deletedAt', value: event.deletedAt ?? null },
      ],
      freezeHeader: false,
      autoFilter: false,
    });
 
    // 2) Users
    renderer.addTableSheet({
      name: 'Users',
      columns: [
        { header: 'id', key: 'id', width: 36, value: (u) => u.id },
        {
          header: 'username',
          key: 'username',
          width: 22,
          value: (u) => u.username ?? '',
        },
        {
          header: 'firstName',
          key: 'firstName',
          width: 18,
          value: (u) => u.firstName ?? '',
        },
        {
          header: 'lastName',
          key: 'lastName',
          width: 18,
          value: (u) => u.lastName ?? '',
        },
        {
          header: 'gender',
          key: 'gender',
          width: 10,
          value: (u) => u.gender,
        },
        { header: 'role', key: 'role', width: 14, value: (u) => u.role },
        {
          header: 'eventBeerCount',
          key: 'eventBeerCount',
          width: 16,
          value: (u) => u.eventBeerCount,
        },
        {
          header: 'deletedAt',
          key: 'deletedAt',
          width: 22,
          value: (u) => u.deletedAt ?? null,
          numFmt: 'yyyy-mm-dd hh:mm:ss',
        },
      ],
      rows: users,
    });
 
    // 3) Barrels
    renderer.addTableSheet({
      name: 'Barrels',
      columns: [
        { header: 'id', key: 'id', width: 36, value: (b) => b.id },
        { header: 'size', key: 'size', width: 10, value: (b) => b.size },
        {
          header: 'orderNumber',
          key: 'orderNumber',
          width: 14,
          value: (b) => b.orderNumber,
        },
        {
          header: 'remainingBeers',
          key: 'remainingBeers',
          width: 16,
          value: (b) => b.remainingBeers,
        },
        {
          header: 'totalBeers',
          key: 'totalBeers',
          width: 12,
          value: (b) => b.totalBeers,
        },
        {
          header: 'isActive',
          key: 'isActive',
          width: 10,
          value: (b) => b.isActive,
        },
        {
          header: 'deletedAt',
          key: 'deletedAt',
          width: 22,
          value: (b) => b.deletedAt ?? null,
          numFmt: 'yyyy-mm-dd hh:mm:ss',
        },
      ],
      rows: barrels,
    });
 
    // 4) Beer log (paged for row limit safety)
    renderer.addPagedTableSheets({
      namePrefix: 'Beer_log',
      columns: [
        {
          header: 'consumedAt',
          key: 'consumedAt',
          width: 22,
          value: (r) => r.consumedAt,
          numFmt: 'yyyy-mm-dd hh:mm:ss',
        },
        { header: 'userId', key: 'userId', width: 36, value: (r) => r.userId },
        {
          header: 'username',
          key: 'username',
          width: 22,
          value: (r) => r.user?.username ?? '',
        },
        {
          header: 'barrelId',
          key: 'barrelId',
          width: 36,
          value: (r) => r.barrelId ?? '',
        },
        {
          header: 'barrelSize',
          key: 'barrelSize',
          width: 12,
          value: (r) => r.barrel?.size ?? null,
        },
        {
          header: 'barrelOrderNumber',
          key: 'barrelOrderNumber',
          width: 18,
          value: (r) => r.barrel?.orderNumber ?? null,
        },
        {
          header: 'spilled',
          key: 'spilled',
          width: 10,
          value: (r) => r.spilled,
        },
        {
          header: 'deletedAt',
          key: 'deletedAt',
          width: 22,
          value: (r) => r.deletedAt ?? null,
          numFmt: 'yyyy-mm-dd hh:mm:ss',
        },
      ],
      rows: beerLog,
    });
 
    // 5) Beer pong teams
    renderer.addTableSheet({
      name: 'BeerPong_teams',
      columns: [
        { header: 'id', key: 'id', width: 36, value: (t) => t.id },
        { header: 'name', key: 'name', width: 24, value: (t) => t.name },
        {
          header: 'player1',
          key: 'player1',
          width: 24,
          value: (t) => t.player1.username ?? '',
        },
        {
          header: 'player2',
          key: 'player2',
          width: 24,
          value: (t) => t.player2.username ?? '',
        },
        {
          header: 'player1Id',
          key: 'player1Id',
          width: 36,
          value: (t) => t.player1Id,
        },
        {
          header: 'player2Id',
          key: 'player2Id',
          width: 36,
          value: (t) => t.player2Id,
        },
        {
          header: 'deletedAt',
          key: 'deletedAt',
          width: 22,
          value: (t) => t.deletedAt ?? null,
          numFmt: 'yyyy-mm-dd hh:mm:ss',
        },
      ],
      rows: beerPongTeams,
    });
 
    // 6) Beer pong events
    renderer.addTableSheet({
      name: 'BeerPong_events',
      columns: [
        { header: 'id', key: 'id', width: 36, value: (e) => e.id },
        { header: 'name', key: 'name', width: 26, value: (e) => e.name },
        {
          header: 'status',
          key: 'status',
          width: 12,
          value: (e) => e.status,
        },
        {
          header: 'beersPerPlayer',
          key: 'beersPerPlayer',
          width: 16,
          value: (e) => e.beersPerPlayer,
        },
        {
          header: 'timeWindowMinutes',
          key: 'timeWindowMinutes',
          width: 18,
          value: (e) => e.timeWindowMinutes,
        },
        {
          header: 'undoWindowMinutes',
          key: 'undoWindowMinutes',
          width: 18,
          value: (e) => e.undoWindowMinutes,
        },
        {
          header: 'cancellationPolicy',
          key: 'cancellationPolicy',
          width: 20,
          value: (e) => e.cancellationPolicy,
        },
        {
          header: 'startedAt',
          key: 'startedAt',
          width: 22,
          value: (e) => e.startedAt ?? null,
          numFmt: 'yyyy-mm-dd hh:mm:ss',
        },
        {
          header: 'completedAt',
          key: 'completedAt',
          width: 22,
          value: (e) => e.completedAt ?? null,
          numFmt: 'yyyy-mm-dd hh:mm:ss',
        },
        {
          header: 'createdAt',
          key: 'createdAt',
          width: 22,
          value: (e) => e.createdAt,
          numFmt: 'yyyy-mm-dd hh:mm:ss',
        },
      ],
      rows: beerPongEvents,
    });
 
    // 7) Aggregates
    const aggregatesSheet = renderer.addSheet('Aggregates');
    aggregatesSheet.getRow(1).values = ['Event statistics'];
    aggregatesSheet.getRow(1).font = { bold: true, size: 14 };
 
    const statsRows: Array<[string, string | number]> = [
      ['Total beers', dashboardStats.totalBeers],
      ['Total users', dashboardStats.totalUsers],
      ['Total barrels', dashboardStats.totalBarrels],
      ['Average beers / user', Number(dashboardStats.averageBeersPerUser.toFixed(2))],
      ['Spilled beers (not deleted)', spilledCount],
      ['Beer log rows (incl. deleted)', beerLog.length],
    ];
 
    aggregatesSheet.addRow([]);
    aggregatesSheet.addRow(['Metric', 'Value']).font = { bold: true };
    for (const [metric, value] of statsRows) {
      aggregatesSheet.addRow([metric, value]);
    }
    aggregatesSheet.getColumn(1).width = 30;
    aggregatesSheet.getColumn(2).width = 20;
 
    aggregatesSheet.addRow([]);
    aggregatesSheet.addRow(['Leaderboard (gender)', 'rank', 'username', 'beerCount']).font =
      { bold: true };
 
    const leaderboardRows = [
      ...leaderboard.males.map((u) => ({
        gender: 'MALE',
        rank: u.rank,
        username: u.username,
        beerCount: u.beerCount,
      })),
      ...leaderboard.females.map((u) => ({
        gender: 'FEMALE',
        rank: u.rank,
        username: u.username,
        beerCount: u.beerCount,
      })),
    ].sort((a, b) => {
      if (a.gender !== b.gender) return a.gender.localeCompare(b.gender);
      if (a.rank !== b.rank) return a.rank - b.rank;
      return b.beerCount - a.beerCount;
    });
 
    for (const r of leaderboardRows) {
      aggregatesSheet.addRow([r.gender, r.rank, r.username, r.beerCount]);
    }
 
    aggregatesSheet.views = [{ state: 'frozen', ySplit: 3 }];
 
    const filenameBase = renderer.safeFileName(`${event.name}_event_detail`);
    const filename = `${filenameBase}.xlsx`;
    return renderer.toStreamableFile(filename);
  }
}
