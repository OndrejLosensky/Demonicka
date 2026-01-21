import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  DashboardResponseDto,
  UserStatsDto,
  BarrelStatsDto,
} from './dto/dashboard.dto';
import { BarrelPredictionService } from '../barrel-prediction/barrel-prediction.service';
import { EventPaceService } from '../event-pace/event-pace.service';
import { LeaderboardDto } from './dto/leaderboard.dto';
import { PublicStatsDto } from './dto/public-stats.dto';
import { SystemStatsDto } from './dto/system-stats.dto';
import {
  PersonalStatsDto,
  EventStatsDto,
  HourlyStatsDto,
} from './dto/personal-stats.dto';
import { UserRole } from '@prisma/client';
import type { User } from '@prisma/client';
import type {
  UserDashboardBeerPongByRoundDto,
  UserDashboardEventBeerPongDto,
  UserDashboardEventDetailDto,
  UserDashboardEventListDto,
  UserDashboardHourlyPointDto,
  UserDashboardOverviewDto,
  UserDashboardTopEventDto,
  UserDashboardUserDto,
} from './dto/user-dashboard.dto';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);
  private lastFetch: number = 0;
  private cachedStats: SystemStatsDto | null = null;
  private readonly CACHE_TTL = 30000; // 30 seconds in milliseconds

  constructor(
    private prisma: PrismaService,
    private readonly barrelPredictionService: BarrelPredictionService,
    private readonly eventPaceService: EventPaceService,
  ) {}

  private toUserDto(user: User): UserDashboardUserDto {
    if (!user.username) {
      // In practice USER accounts should always have username; keep this safe.
      throw new BadRequestException('Uživatel nemá uživatelské jméno');
    }
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      profilePictureUrl: user.profilePictureUrl,
    };
  }

  async resolveDashboardTargetUser(
    username: string | undefined,
    currentUser: User,
  ): Promise<User> {
    const effectiveUsername = username ?? currentUser.username ?? undefined;
    if (!effectiveUsername) {
      throw new BadRequestException('Chybí username');
    }

    const isSelf = currentUser.username === effectiveUsername;
    const isAdmin =
      currentUser.role === UserRole.SUPER_ADMIN ||
      currentUser.role === UserRole.OPERATOR;

    if (!isSelf && !isAdmin) {
      throw new ForbiddenException(
        'Nemáte oprávnění zobrazit statistiky tohoto uživatele',
      );
    }

    const target = await this.prisma.user.findUnique({
      where: { username: effectiveUsername },
    });
    if (!target || target.deletedAt) {
      throw new NotFoundException('Uživatel nebyl nalezen');
    }
    return target;
  }

  async getUserDashboardOverview(
    userId: string,
  ): Promise<UserDashboardOverviewDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt)
      throw new NotFoundException('Uživatel nebyl nalezen');

    const timezoneOffset = process.env.TIMEZONE_OFFSET || '+02:00';

    const activeEvent = await this.prisma.event.findFirst({
      where: { isActive: true, deletedAt: null },
      orderBy: { startDate: 'desc' },
    });
    const seriesEvent =
      activeEvent ??
      (await this.prisma.event.findFirst({
        where: {
          deletedAt: null,
          users: {
            some: {
              userId,
            },
          },
        },
        orderBy: { startDate: 'desc' },
      }));

    const [
      globalBeers,
      eventBeers,
      participatedEvents,
      daily,
      topEvents,
      beerPongSummary,
    ] = await Promise.all([
      this.prisma.beer.count({ where: { userId, deletedAt: null } }),
      this.prisma.eventBeer.count({ where: { userId, deletedAt: null } }),
      this.prisma.eventUsers.count({ where: { userId } }),
      seriesEvent
        ? this.prisma.$queryRaw<
            Array<{
              bucketUtc: Date;
              beers: bigint; // non-spilled
              eventBeers: bigint; // spilled
            }>
          >`
            WITH bounds AS (
              SELECT
                date_trunc('hour', (${seriesEvent.startDate}::timestamptz AT TIME ZONE ${timezoneOffset})) AS start_hour,
                date_trunc('hour', (COALESCE(${seriesEvent.endDate ?? null}::timestamptz, now()) AT TIME ZONE ${timezoneOffset})) AS end_hour
            ),
            hours AS (
              SELECT generate_series(
                (SELECT start_hour FROM bounds),
                (SELECT end_hour FROM bounds),
                interval '1 hour'
              ) AS bucket_local
            ),
            counts AS (
              SELECT
                date_trunc('hour', (eb."consumedAt" AT TIME ZONE ${timezoneOffset})) AS bucket_local,
                COUNT(*) FILTER (WHERE eb."spilled" = false)::bigint AS beers,
                COUNT(*) FILTER (WHERE eb."spilled" = true)::bigint AS "eventBeers"
              FROM "EventBeer" eb
              WHERE eb."eventId" = ${seriesEvent.id}::uuid
                AND eb."userId" = ${userId}::uuid
                AND eb."deletedAt" IS NULL
              GROUP BY 1
            )
            SELECT
              (h.bucket_local AT TIME ZONE ${timezoneOffset}) AS "bucketUtc",
              COALESCE(c.beers, 0)::bigint AS beers,
              COALESCE(c."eventBeers", 0)::bigint AS "eventBeers"
            FROM hours h
            LEFT JOIN counts c ON c.bucket_local = h.bucket_local
            ORDER BY h.bucket_local ASC
          `
        : Promise.resolve(
            [] as Array<{ bucketUtc: Date; beers: bigint; eventBeers: bigint }>,
          ),
      this.prisma.$queryRaw<
        Array<{
          eventId: string;
          eventName: string;
          startDate: Date;
          endDate: Date | null;
          isActive: boolean;
          userBeers: bigint;
          userSpilledBeers: bigint;
          totalEventBeers: bigint;
        }>
      >`
        SELECT
          e.id AS "eventId",
          e.name AS "eventName",
          e."startDate",
          e."endDate",
          e."isActive",
          COALESCE(ub.user_beers, 0)::bigint AS "userBeers",
          COALESCE(ub.user_spilled, 0)::bigint AS "userSpilledBeers",
          COALESCE(tb.total_beers, 0)::bigint AS "totalEventBeers"
        FROM "EventUsers" eu
        JOIN "Event" e ON e.id = eu."eventId" AND e."deletedAt" IS NULL
        LEFT JOIN (
          SELECT
            "eventId",
            COUNT(*)::bigint AS user_beers,
            COUNT(*) FILTER (WHERE "spilled" = true)::bigint AS user_spilled
          FROM "EventBeer"
          WHERE "userId" = ${userId}::uuid
            AND "deletedAt" IS NULL
          GROUP BY "eventId"
        ) ub ON ub."eventId" = e.id
        LEFT JOIN (
          SELECT
            "eventId",
            COUNT(*)::bigint AS total_beers
          FROM "EventBeer"
          WHERE "deletedAt" IS NULL
          GROUP BY "eventId"
        ) tb ON tb."eventId" = e.id
        WHERE eu."userId" = ${userId}::uuid
        ORDER BY e."startDate" DESC
        LIMIT 6
      `,
      this.prisma.$queryRaw<
        Array<{
          gamesPlayed: bigint;
          gamesWon: bigint;
          avgDurationSeconds: number | null;
          beersFromBeerPong: bigint;
        }>
      >`
        WITH user_games AS (
          SELECT
            g.id,
            g."durationSeconds",
            CASE
              WHEN w.id IS NOT NULL AND (w."player1Id" = ${userId}::uuid OR w."player2Id" = ${userId}::uuid)
                THEN true
              ELSE false
            END AS "userWon"
          FROM "BeerPongGame" g
          JOIN "BeerPongEvent" e ON e.id = g."beerPongEventId" AND e."deletedAt" IS NULL
          LEFT JOIN "BeerPongTeam" t1 ON t1.id = g."team1Id"
          LEFT JOIN "BeerPongTeam" t2 ON t2.id = g."team2Id"
          LEFT JOIN "BeerPongTeam" w  ON w.id  = g."winnerTeamId"
          WHERE
            (t1."player1Id" = ${userId}::uuid OR t1."player2Id" = ${userId}::uuid OR
             t2."player1Id" = ${userId}::uuid OR t2."player2Id" = ${userId}::uuid)
        ),
        beer_pong_beers AS (
          SELECT COUNT(*)::bigint AS beers
          FROM "BeerPongGameBeer" bgb
          WHERE bgb."userId" = ${userId}::uuid
        )
        SELECT
          (SELECT COUNT(*)::bigint FROM user_games) AS "gamesPlayed",
          (SELECT COUNT(*)::bigint FROM user_games WHERE "userWon" = true) AS "gamesWon",
          (SELECT AVG("durationSeconds") FROM user_games) AS "avgDurationSeconds",
          (SELECT beers FROM beer_pong_beers) AS "beersFromBeerPong"
      `,
    ]);

    const dailyPoints = daily.map((p) => {
      const beers = Number(p.beers);
      const eventBeers = Number(p.eventBeers);
      return {
        date: p.bucketUtc.toISOString(),
        beers,
        eventBeers,
        totalBeers: beers + eventBeers,
      };
    });

    const topEventDtos: UserDashboardTopEventDto[] = topEvents.map((e) => {
      const userBeersN = Number(e.userBeers);
      const totalBeersN = Number(e.totalEventBeers);
      const share = totalBeersN > 0 ? (userBeersN / totalBeersN) * 100 : 0;
      return {
        eventId: e.eventId,
        eventName: e.eventName,
        startDate: e.startDate.toISOString(),
        endDate: e.endDate ? e.endDate.toISOString() : null,
        isActive: e.isActive,
        userBeers: userBeersN,
        totalEventBeers: totalBeersN,
        sharePercent: share,
        userSpilledBeers: Number(e.userSpilledBeers),
      };
    });

    const pong = beerPongSummary?.[0];
    const gamesPlayed = Number(pong?.gamesPlayed ?? 0);
    const gamesWon = Number(pong?.gamesWon ?? 0);
    const beersFromBeerPong = Number(pong?.beersFromBeerPong ?? 0);

    return {
      user: this.toUserDto(user),
      totals: {
        beers: globalBeers,
        eventBeers,
        participatedEvents,
        totalBeers: globalBeers + eventBeers,
      },
      activeEvent: seriesEvent
        ? {
            id: seriesEvent.id,
            name: seriesEvent.name,
            startDate: seriesEvent.startDate.toISOString(),
            endDate: seriesEvent.endDate
              ? seriesEvent.endDate.toISOString()
              : null,
            isActive: seriesEvent.isActive,
          }
        : undefined,
      daily: dailyPoints,
      topEvents: topEventDtos,
      beerPong: {
        gamesPlayed,
        gamesWon,
        winRate: gamesPlayed > 0 ? gamesWon / gamesPlayed : 0,
        beersFromBeerPong,
        averageGameDurationSeconds: pong?.avgDurationSeconds ?? null,
      },
    };
  }

  async getUserDashboardEvents(
    userId: string,
  ): Promise<UserDashboardEventListDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt)
      throw new NotFoundException('Uživatel nebyl nalezen');

    const rows = await this.prisma.$queryRaw<
      Array<{
        eventId: string;
        eventName: string;
        startDate: Date;
        endDate: Date | null;
        isActive: boolean;
        userBeers: bigint;
        userSpilledBeers: bigint;
        totalEventBeers: bigint;
        totalEventSpilledBeers: bigint;
      }>
    >`
      SELECT
        e.id AS "eventId",
        e.name AS "eventName",
        e."startDate",
        e."endDate",
        e."isActive",
        COALESCE(ub.user_beers, 0)::bigint AS "userBeers",
        COALESCE(ub.user_spilled, 0)::bigint AS "userSpilledBeers",
        COALESCE(tb.total_beers, 0)::bigint AS "totalEventBeers",
        COALESCE(tb.total_spilled, 0)::bigint AS "totalEventSpilledBeers"
      FROM "EventUsers" eu
      JOIN "Event" e ON e.id = eu."eventId" AND e."deletedAt" IS NULL
      LEFT JOIN (
        SELECT
          "eventId",
          COUNT(*)::bigint AS user_beers,
          COUNT(*) FILTER (WHERE "spilled" = true)::bigint AS user_spilled
        FROM "EventBeer"
        WHERE "userId" = ${userId}::uuid
          AND "deletedAt" IS NULL
        GROUP BY "eventId"
      ) ub ON ub."eventId" = e.id
      LEFT JOIN (
        SELECT
          "eventId",
          COUNT(*)::bigint AS total_beers,
          COUNT(*) FILTER (WHERE "spilled" = true)::bigint AS total_spilled
        FROM "EventBeer"
        WHERE "deletedAt" IS NULL
        GROUP BY "eventId"
      ) tb ON tb."eventId" = e.id
      WHERE eu."userId" = ${userId}::uuid
      ORDER BY e."startDate" DESC
    `;

    const events: UserDashboardTopEventDto[] = rows.map((r) => {
      const userBeersN = Number(r.userBeers);
      const totalBeersN = Number(r.totalEventBeers);
      return {
        eventId: r.eventId,
        eventName: r.eventName,
        startDate: r.startDate.toISOString(),
        endDate: r.endDate ? r.endDate.toISOString() : null,
        isActive: r.isActive,
        userBeers: userBeersN,
        totalEventBeers: totalBeersN,
        sharePercent: totalBeersN > 0 ? (userBeersN / totalBeersN) * 100 : 0,
        userSpilledBeers: Number(r.userSpilledBeers),
      };
    });

    return { user: this.toUserDto(user), events };
  }

  async getUserDashboardEventDetail(
    userId: string,
    eventId: string,
  ): Promise<UserDashboardEventDetailDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt)
      throw new NotFoundException('Uživatel nebyl nalezen');

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event || event.deletedAt)
      throw new NotFoundException('Událost nebyla nalezena');

    const participation = await this.prisma.eventUsers.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (!participation) {
      throw new NotFoundException('Uživatel se této události neúčastnil');
    }

    const timezoneOffset = process.env.TIMEZONE_OFFSET || '+02:00';

    const [summaryRow, hourlyRows] = await Promise.all([
      this.prisma.$queryRaw<
        Array<{
          userBeers: bigint;
          userSpilledBeers: bigint;
          totalEventBeers: bigint;
          totalEventSpilledBeers: bigint;
        }>
      >`
        SELECT
          COUNT(*) FILTER (WHERE eb."userId" = ${userId}::uuid)::bigint AS "userBeers",
          COUNT(*) FILTER (WHERE eb."userId" = ${userId}::uuid AND eb."spilled" = true)::bigint AS "userSpilledBeers",
          COUNT(*)::bigint AS "totalEventBeers",
          COUNT(*) FILTER (WHERE eb."spilled" = true)::bigint AS "totalEventSpilledBeers"
        FROM "EventBeer" eb
        WHERE eb."eventId" = ${eventId}::uuid
          AND eb."deletedAt" IS NULL
      `,
      this.prisma.$queryRaw<
        Array<{
          bucketUtc: Date;
          count: bigint;
          spilled: bigint;
        }>
      >`
        WITH bounds AS (
          SELECT
            date_trunc('hour', (e."startDate" AT TIME ZONE ${timezoneOffset})) AS start_hour,
            date_trunc('hour', (COALESCE(e."endDate", now()) AT TIME ZONE ${timezoneOffset})) AS end_hour
          FROM "Event" e
          WHERE e.id = ${eventId}::uuid
        ),
        hours AS (
          SELECT generate_series(start_hour, end_hour, interval '1 hour') AS bucket_local
          FROM bounds
        ),
        counts AS (
          SELECT
            date_trunc('hour', (eb."consumedAt" AT TIME ZONE ${timezoneOffset})) AS bucket_local,
            COUNT(*) FILTER (WHERE eb."spilled" = false)::bigint AS count,
            COUNT(*) FILTER (WHERE eb."spilled" = true)::bigint AS spilled
          FROM "EventBeer" eb
          WHERE eb."eventId" = ${eventId}::uuid
            AND eb."userId" = ${userId}::uuid
            AND eb."deletedAt" IS NULL
          GROUP BY 1
        )
        SELECT
          (h.bucket_local AT TIME ZONE ${timezoneOffset}) AS "bucketUtc",
          COALESCE(c.count, 0)::bigint AS count,
          COALESCE(c.spilled, 0)::bigint AS spilled
        FROM hours h
        LEFT JOIN counts c ON c.bucket_local = h.bucket_local
        ORDER BY h.bucket_local ASC
      `,
    ]);

    const summary = summaryRow?.[0];
    const userBeersN = Number(summary?.userBeers ?? 0);
    const totalBeersN = Number(summary?.totalEventBeers ?? 0);

    const hourly: UserDashboardHourlyPointDto[] = (hourlyRows ?? []).map(
      (r) => ({
        bucketUtc: r.bucketUtc.toISOString(),
        count: Number(r.count),
        spilled: Number(r.spilled),
      }),
    );

    return {
      user: this.toUserDto(user),
      event: {
        id: event.id,
        name: event.name,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate ? event.endDate.toISOString() : null,
        isActive: event.isActive,
      },
      summary: {
        userBeers: userBeersN,
        userSpilledBeers: Number(summary?.userSpilledBeers ?? 0),
        totalEventBeers: totalBeersN,
        totalEventSpilledBeers: Number(summary?.totalEventSpilledBeers ?? 0),
        sharePercent: totalBeersN > 0 ? (userBeersN / totalBeersN) * 100 : 0,
      },
      hourly,
    };
  }

  async getUserDashboardEventBeerPong(
    userId: string,
    eventId: string,
  ): Promise<UserDashboardEventBeerPongDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt)
      throw new NotFoundException('Uživatel nebyl nalezen');

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event || event.deletedAt)
      throw new NotFoundException('Událost nebyla nalezena');

    const participation = await this.prisma.eventUsers.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (!participation) {
      throw new NotFoundException('Uživatel se této události neúčastnil');
    }

    const [tournaments, summaryRows, byRoundRows, beersFromRows] =
      await Promise.all([
        this.prisma.beerPongEvent.findMany({
          where: { eventId, deletedAt: null },
          select: {
            id: true,
            name: true,
            status: true,
            startedAt: true,
            completedAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.$queryRaw<
          Array<{
            gamesPlayed: bigint;
            gamesWon: bigint;
            avgDurationSeconds: number | null;
          }>
        >`
        WITH user_games AS (
          SELECT
            g.id,
            g."durationSeconds",
            CASE
              WHEN w.id IS NOT NULL AND (w."player1Id" = ${userId}::uuid OR w."player2Id" = ${userId}::uuid)
                THEN true
              ELSE false
            END AS "userWon"
          FROM "BeerPongGame" g
          JOIN "BeerPongEvent" e ON e.id = g."beerPongEventId"
            AND e."eventId" = ${eventId}::uuid
            AND e."deletedAt" IS NULL
          LEFT JOIN "BeerPongTeam" t1 ON t1.id = g."team1Id"
          LEFT JOIN "BeerPongTeam" t2 ON t2.id = g."team2Id"
          LEFT JOIN "BeerPongTeam" w  ON w.id  = g."winnerTeamId"
          WHERE
            (t1."player1Id" = ${userId}::uuid OR t1."player2Id" = ${userId}::uuid OR
             t2."player1Id" = ${userId}::uuid OR t2."player2Id" = ${userId}::uuid)
        )
        SELECT
          COUNT(*)::bigint AS "gamesPlayed",
          COUNT(*) FILTER (WHERE "userWon" = true)::bigint AS "gamesWon",
          AVG("durationSeconds") AS "avgDurationSeconds"
        FROM user_games
      `,
        this.prisma.$queryRaw<
          Array<{ round: string; gamesPlayed: bigint; gamesWon: bigint }>
        >`
        WITH user_games AS (
          SELECT
            g.id,
            g.round,
            CASE
              WHEN w.id IS NOT NULL AND (w."player1Id" = ${userId}::uuid OR w."player2Id" = ${userId}::uuid)
                THEN true
              ELSE false
            END AS "userWon"
          FROM "BeerPongGame" g
          JOIN "BeerPongEvent" e ON e.id = g."beerPongEventId"
            AND e."eventId" = ${eventId}::uuid
            AND e."deletedAt" IS NULL
          LEFT JOIN "BeerPongTeam" t1 ON t1.id = g."team1Id"
          LEFT JOIN "BeerPongTeam" t2 ON t2.id = g."team2Id"
          LEFT JOIN "BeerPongTeam" w  ON w.id  = g."winnerTeamId"
          WHERE
            (t1."player1Id" = ${userId}::uuid OR t1."player2Id" = ${userId}::uuid OR
             t2."player1Id" = ${userId}::uuid OR t2."player2Id" = ${userId}::uuid)
        )
        SELECT
          round::text AS round,
          COUNT(*)::bigint AS "gamesPlayed",
          COUNT(*) FILTER (WHERE "userWon" = true)::bigint AS "gamesWon"
        FROM user_games
        GROUP BY 1
        ORDER BY 1
      `,
        this.prisma.$queryRaw<Array<{ beersFromBeerPong: bigint }>>`
        SELECT COUNT(*)::bigint AS "beersFromBeerPong"
        FROM "BeerPongGameBeer" bgb
        JOIN "BeerPongGame" g ON g.id = bgb."beerPongGameId"
        JOIN "BeerPongEvent" e ON e.id = g."beerPongEventId"
        WHERE e."eventId" = ${eventId}::uuid
          AND e."deletedAt" IS NULL
          AND bgb."userId" = ${userId}::uuid
      `,
      ]);

    const s = summaryRows?.[0];
    const gamesPlayed = Number(s?.gamesPlayed ?? 0);
    const gamesWon = Number(s?.gamesWon ?? 0);
    const beersFromBeerPong = Number(
      beersFromRows?.[0]?.beersFromBeerPong ?? 0,
    );

    const gamesByRound: UserDashboardBeerPongByRoundDto[] = (
      byRoundRows ?? []
    ).map((r) => ({
      round: r.round,
      gamesPlayed: Number(r.gamesPlayed),
      gamesWon: Number(r.gamesWon),
    }));

    return {
      user: this.toUserDto(user),
      event: {
        id: event.id,
        name: event.name,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate ? event.endDate.toISOString() : null,
        isActive: event.isActive,
      },
      tournaments: tournaments.map((t) => ({
        id: t.id,
        name: t.name,
        status: t.status,
        startedAt: t.startedAt ? t.startedAt.toISOString() : null,
        completedAt: t.completedAt ? t.completedAt.toISOString() : null,
      })),
      summary: {
        gamesPlayed,
        gamesWon,
        winRate: gamesPlayed > 0 ? gamesWon / gamesPlayed : 0,
        beersFromBeerPong,
        averageGameDurationSeconds: s?.avgDurationSeconds ?? null,
        gamesByRound,
      },
    };
  }

  async getPublicStats(eventId?: string): Promise<PublicStatsDto> {
    if (eventId) {
      const event = await this.prisma.event.findUnique({
        where: { id: eventId },
        include: {
          users: { include: { user: true } },
          barrels: { include: { barrel: true } },
        },
      });

      if (!event) {
        throw new Error('Event not found');
      }

      // Event-specific stats
      const eventUserIds = event.users.map((eu) => eu.userId);
      const eventBarrelIds = event.barrels.map((eb) => eb.barrelId);

      // Get beer count for event users using event_beers table
      const totalBeers = await this.prisma.eventBeer.count({
        where: {
          eventId: event.id,
          userId: { in: eventUserIds },
          deletedAt: null,
        },
      });

      // Get top users for this event using event_beers
      const eventBeerCounts = await this.prisma.eventBeer.groupBy({
        by: ['userId'],
        where: {
          eventId: event.id,
          userId: { in: eventUserIds },
          deletedAt: null,
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 6,
      });

      const userIds = eventBeerCounts.map((eb) => eb.userId);
      const users = await this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, username: true },
      });

      const topUsers = eventBeerCounts.map((eb) => {
        const user = users.find((u) => u.id === eb.userId);
        return {
          username: user?.username || '',
          beerCount: eb._count.id,
        };
      });

      // Get barrel statistics for this event
      const barrels = await this.prisma.barrel.findMany({
        where: {
          id: { in: eventBarrelIds },
          deletedAt: null,
        },
        select: { size: true },
      });

      const barrelStatsMap = new Map<number, number>();
      barrels.forEach((barrel) => {
        barrelStatsMap.set(
          barrel.size,
          (barrelStatsMap.get(barrel.size) || 0) + 1,
        );
      });

      const formattedBarrelStats = Array.from(barrelStatsMap.entries()).map(
        ([size, count]) => ({
          size,
          count,
        }),
      );

      return {
        totalBeers,
        totalUsers: event.users.length,
        totalBarrels: event.barrels.length,
        topUsers,
        barrelStats: formattedBarrelStats,
      };
    } else {
      // Global stats
      const totalUsers = await this.prisma.user.count({
        where: { deletedAt: null },
      });
      const totalBeers = await this.prisma.beer.count({
        where: { deletedAt: null },
      });
      const totalBarrels = await this.prisma.barrel.count({
        where: { deletedAt: null },
      });

      // Get top users by beer count
      const topUsersData = await this.prisma.user.findMany({
        where: { deletedAt: null },
        select: { id: true, username: true, beerCount: true },
        orderBy: { beerCount: 'desc' },
        take: 6,
      });

      const topUsers = topUsersData.map((u) => ({
        username: u.username || '',
        beerCount: u.beerCount || 0,
      }));

      // Get barrel statistics
      const barrels = await this.prisma.barrel.findMany({
        where: { deletedAt: null },
        select: { size: true },
      });

      const barrelStatsMap = new Map<number, number>();
      barrels.forEach((barrel) => {
        barrelStatsMap.set(
          barrel.size,
          (barrelStatsMap.get(barrel.size) || 0) + 1,
        );
      });

      const formattedBarrelStats = Array.from(barrelStatsMap.entries()).map(
        ([size, count]) => ({
          size,
          count,
        }),
      );

      return {
        totalBeers,
        totalUsers,
        totalBarrels,
        topUsers,
        barrelStats: formattedBarrelStats,
      };
    }
  }

  async getDashboardStats(eventId?: string): Promise<DashboardResponseDto> {
    if (eventId) {
      const event = await this.prisma.event.findUnique({
        where: { id: eventId },
        include: {
          users: { include: { user: true } },
          barrels: { include: { barrel: true } },
        },
      });

      if (!event) {
        throw new Error('Event not found');
      }

      // Event-specific stats
      const eventUserIds = event.users.map((eu) => eu.userId);
      const eventBarrelIds = event.barrels.map((eb) => eb.barrelId);

      // Get beer count for event users using event_beers table
      const totalBeers = await this.prisma.eventBeer.count({
        where: {
          eventId: event.id,
          userId: { in: eventUserIds },
          deletedAt: null,
        },
      });

      const totalUsers = event.users.length;
      const totalBarrels = event.barrels.length;
      const averageBeersPerUser = totalUsers ? totalBeers / totalUsers : 0;

      // Get top users for this event using event_beers
      const eventBeerCounts = await this.prisma.eventBeer.groupBy({
        by: ['userId'],
        where: {
          eventId: event.id,
          userId: { in: eventUserIds },
          deletedAt: null,
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      });

      const userIds = eventBeerCounts.map((eb) => eb.userId);
      const users = await this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, username: true, profilePictureUrl: true },
      });

      const topUsers: UserStatsDto[] = eventBeerCounts.map((eb) => {
        const user = users.find((u) => u.id === eb.userId);
        return {
          id: eb.userId,
          username: user?.username || '',
          beerCount: eb._count.id,
          profilePictureUrl: user?.profilePictureUrl || null,
        };
      });

      // Get barrel statistics for this event
      const barrels = await this.prisma.barrel.findMany({
        where: {
          id: { in: eventBarrelIds },
          deletedAt: null,
        },
        select: { size: true },
      });

      const barrelStatsMap = new Map<number, number>();
      barrels.forEach((barrel) => {
        barrelStatsMap.set(
          barrel.size,
          (barrelStatsMap.get(barrel.size) || 0) + 1,
        );
      });

      const formattedBarrelStats: BarrelStatsDto[] = Array.from(
        barrelStatsMap.entries(),
      ).map(([size, count]) => ({
        size,
        count,
      }));

      let barrelPrediction: DashboardResponseDto['barrelPrediction'] | undefined =
        undefined;
      try {
        barrelPrediction = await this.barrelPredictionService.getForEvent(eventId);
      } catch (error) {
        this.logger.warn('Failed to compute barrel prediction', {
          eventId,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      let eventPace: DashboardResponseDto['eventPace'] | undefined = undefined;
      try {
        eventPace = await this.eventPaceService.getForEvent(eventId);
      } catch (error) {
        this.logger.warn('Failed to compute event pace', {
          eventId,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      return {
        totalBeers,
        totalUsers,
        totalBarrels,
        averageBeersPerUser,
        topUsers,
        barrelStats: formattedBarrelStats,
        barrelPrediction,
        eventPace,
      };
    } else {
      // Global stats
      const totalUsers = await this.prisma.user.count({
        where: { deletedAt: null },
      });
      const totalBeers = await this.prisma.beer.count({
        where: { deletedAt: null },
      });
      const totalBarrels = await this.prisma.barrel.count({
        where: { deletedAt: null },
      });
      const averageBeersPerUser = totalUsers ? totalBeers / totalUsers : 0;

      // Get top users by beer count
      const topUsersData = await this.prisma.user.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          username: true,
          beerCount: true,
          profilePictureUrl: true,
        },
        orderBy: { beerCount: 'desc' },
        take: 10,
      });

      const topUsers: UserStatsDto[] = topUsersData.map((u) => ({
        id: u.id,
        username: u.username || '',
        beerCount: u.beerCount || 0,
        profilePictureUrl: u.profilePictureUrl || null,
      }));

      // Get barrel statistics
      const barrels = await this.prisma.barrel.findMany({
        where: { deletedAt: null },
        select: { size: true },
      });

      const barrelStatsMap = new Map<number, number>();
      barrels.forEach((barrel) => {
        barrelStatsMap.set(
          barrel.size,
          (barrelStatsMap.get(barrel.size) || 0) + 1,
        );
      });

      const formattedBarrelStats: BarrelStatsDto[] = Array.from(
        barrelStatsMap.entries(),
      ).map(([size, count]) => ({
        size,
        count,
      }));

      return {
        totalBeers,
        totalUsers,
        totalBarrels,
        averageBeersPerUser,
        topUsers,
        barrelStats: formattedBarrelStats,
      };
    }
  }

  async getLeaderboard(eventId?: string): Promise<LeaderboardDto> {
    // Always require an eventId - no more global fallback
    if (!eventId) {
      throw new Error('Event ID is required for leaderboard');
    }

    this.logger.log(`Loading leaderboard for event: ${eventId}`);

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        users: { include: { user: true } },
      },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    this.logger.log(
      `Event found: ${event.name} with ${event.users.length} users`,
    );

    // Event-specific leaderboard only
    const eventUserIds = event.users.map((eu) => eu.userId);

    // Get total event beers
    const totalEventBeers = await this.prisma.eventBeer.count({
      where: {
        eventId: event.id,
        userId: { in: eventUserIds },
        deletedAt: null,
      },
    });

    this.logger.log(
      `Total event beers from event_beers table for event ${event.id}: ${totalEventBeers}`,
    );

    // Get user rankings with their individual beer counts
    const eventBeerCounts = await this.prisma.eventBeer.groupBy({
      by: ['userId'],
      where: {
        eventId: event.id,
        userId: { in: eventUserIds },
        deletedAt: null,
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    type LeaderboardUserRow = {
      id: string;
      username: string | null;
      gender: 'MALE' | 'FEMALE';
      profilePictureUrl: string | null;
    };

    const userIds = eventBeerCounts.map((eb) => eb.userId);
    const usersRaw = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        username: true,
        gender: true,
        profilePictureUrl: true,
      },
    });

    const users: LeaderboardUserRow[] = usersRaw.map((u) => ({
      id: u.id,
      username: u.username,
      gender: u.gender as LeaderboardUserRow['gender'],
      profilePictureUrl: u.profilePictureUrl ?? null,
    }));

    const userMap = new Map<string, LeaderboardUserRow>(
      users.map((u) => [u.id, u]),
    );
    const beerCountMap = new Map(
      eventBeerCounts.map((eb) => [eb.userId, eb._count.id]),
    );

    // Include users with 0 beers
    eventUserIds.forEach((userId) => {
      if (!beerCountMap.has(userId)) {
        beerCountMap.set(userId, 0);
      }
      if (!userMap.has(userId)) {
        const eventUser = event.users.find((eu) => eu.userId === userId);
        if (eventUser) {
          userMap.set(userId, {
            id: eventUser.user.id,
            username: eventUser.user.username,
            gender: eventUser.user.gender as LeaderboardUserRow['gender'],
            profilePictureUrl: eventUser.user.profilePictureUrl ?? null,
          });
        }
      }
    });

    // Get all eventBeers to determine when users reached their current beer count
    const allEventBeers = await this.prisma.eventBeer.findMany({
      where: {
        eventId: event.id,
        userId: { in: eventUserIds },
        deletedAt: null,
      },
      select: {
        userId: true,
        consumedAt: true,
      },
      orderBy: {
        consumedAt: 'asc',
      },
    });

    // Group beers by userId and calculate timestamp when user reached current count
    const userBeersMap = new Map<string, Date[]>();
    allEventBeers.forEach((beer) => {
      if (!userBeersMap.has(beer.userId)) {
        userBeersMap.set(beer.userId, []);
      }
      userBeersMap.get(beer.userId)!.push(beer.consumedAt);
    });

    // Helper function to get timestamp when user reached their current beer count
    const getReachedAtTimestamp = (userId: string, beerCount: number): Date => {
      const beers = userBeersMap.get(userId) || [];
      if (beerCount === 0 || beers.length === 0) {
        return new Date(0); // Users with 0 beers get timestamp 0 (sorted last)
      }
      // Get the timestamp of the nth beer (where n is the current beerCount)
      const nthBeerIndex = Math.min(beerCount - 1, beers.length - 1);
      return beers[nthBeerIndex];
    };

    const allUsers = Array.from(userMap.entries())
      .map(([userId, user]) => ({
        id: userId,
        username: user.username || '',
        gender: user.gender,
        beerCount: beerCountMap.get(userId) || 0,
        profilePictureUrl: user.profilePictureUrl || null,
        reachedAt: getReachedAtTimestamp(userId, beerCountMap.get(userId) || 0),
      }))
      .sort((a, b) => {
        // Sort by beerCount desc, then by reachedAt asc (earlier = reached that count first)
        if (b.beerCount !== a.beerCount) {
          return b.beerCount - a.beerCount;
        }
        return a.reachedAt.getTime() - b.reachedAt.getTime();
      });

    // Calculate shared ranks (dense ranking: users with same beer count share rank, next rank increments by 1)
    type UserWithReachedAt = (typeof allUsers)[0];
    type UserWithRank = UserWithReachedAt & { rank: number };

    const calculateRanks = (users: UserWithReachedAt[]): UserWithRank[] => {
      let currentRank = 1;
      const result: UserWithRank[] = [];

      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        if (i > 0 && users[i - 1].beerCount === user.beerCount) {
          // Same beer count as previous user - share the rank
          result.push({ ...user, rank: result[i - 1].rank });
        } else {
          // Different beer count or first user - assign new rank
          result.push({ ...user, rank: currentRank });
          currentRank += 1;
        }
      }

      return result;
    };

    // Split by gender first, then calculate ranks separately for each group
    const males = allUsers.filter((u) => u.gender === 'MALE');
    const females = allUsers.filter((u) => u.gender === 'FEMALE');

    const malesWithRanks = calculateRanks(males).map((u) => {
      const { reachedAt, ...rest } = u;
      void reachedAt;
      return rest;
    });
    const femalesWithRanks = calculateRanks(females).map((u) => {
      const { reachedAt, ...rest } = u;
      void reachedAt;
      return rest;
    });

    const result = {
      males: malesWithRanks,
      females: femalesWithRanks,
    };

    const totalBeers =
      result.males.reduce((sum, u) => sum + u.beerCount, 0) +
      result.females.reduce((sum, u) => sum + u.beerCount, 0);

    this.logger.log(
      `Leaderboard result: ${result.males.length} males, ${result.females.length} females, total beers: ${totalBeers}`,
    );
    this.logger.log(
      `Verification: Direct count from event_beers table: ${totalEventBeers}, Sum from user counts: ${totalBeers}`,
    );

    // Verify our counts match
    if (totalBeers !== totalEventBeers) {
      this.logger.warn(
        `COUNT MISMATCH! Direct count: ${totalEventBeers}, User sum: ${totalBeers}`,
      );
    }

    return result;
  }

  async getSystemStats(): Promise<SystemStatsDto> {
    const now = Date.now();

    // Return cached data if it's still fresh
    if (this.cachedStats && now - this.lastFetch < this.CACHE_TTL) {
      this.logger.log('Returning cached system stats');
      return this.cachedStats;
    }

    this.logger.log('Cache miss - fetching fresh system stats');

    try {
      const users = await this.prisma.user.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          username: true,
          role: true,
          isRegistrationComplete: true,
          isTwoFactorEnabled: true,
          canLogin: true,
          lastAdminLogin: true,
        },
      });

      this.logger.log(`Found ${users.length} users`);

      const stats = {
        users: users.map((user) => ({
          id: user.id,
          username: user.username,
          role: user.role,
          isRegistrationComplete: user.isRegistrationComplete,
          isTwoFactorEnabled: user.isTwoFactorEnabled,
          canLogin: user.canLogin,
          lastAdminLogin: user.lastAdminLogin,
        })),
        totalUsers: users.length,
        totalOperatorUsers: users.filter(
          (u) =>
            u.role === UserRole.OPERATOR || u.role === UserRole.SUPER_ADMIN,
        ).length,
        totalCompletedRegistrations: users.filter(
          (u) => u.isRegistrationComplete,
        ).length,
        total2FAEnabled: users.filter((u) => u.isTwoFactorEnabled).length,
      };

      // Update cache
      this.cachedStats = stats;
      this.lastFetch = now;
      this.logger.log('System stats cached successfully');

      return stats;
    } catch (error) {
      this.logger.error('Failed to fetch system stats', error);
      throw error;
    }
  }

  async getPersonalStats(userId: string): Promise<PersonalStatsDto> {
    try {
      this.logger.log(`Fetching personal stats for user: ${userId}`);

      // Get total beers for the user
      const totalBeers = await this.prisma.beer.count({
        where: { userId, deletedAt: null },
      });

      this.logger.log(`Total beers for user: ${totalBeers}`);

      // Get all events the user participated in
      const userEvents = await this.prisma.eventUsers.findMany({
        where: { userId },
        include: { event: true },
      });

      const events = userEvents.map((eu) => eu.event);
      this.logger.log(`User events count: ${events.length}`);

      const eventStats: EventStatsDto[] = [];

      for (const event of events) {
        // Get user's beers for this event
        const userBeers = await this.prisma.eventBeer.count({
          where: { eventId: event.id, userId, deletedAt: null },
        });

        // Get total beers for this event
        const totalEventBeers = await this.prisma.eventBeer.count({
          where: { eventId: event.id, deletedAt: null },
        });

        // Calculate contribution percentage
        const contribution =
          totalEventBeers > 0 ? (userBeers / totalEventBeers) * 100 : 0;

        // Get hourly stats for this event (using PostgreSQL date functions)
        const timezoneOffset = process.env.TIMEZONE_OFFSET || '+02:00';

        const hourlyStatsRaw = await this.prisma.$queryRaw<
          Array<{ hour: number; count: bigint }>
        >`
          SELECT 
            EXTRACT(HOUR FROM ("consumedAt" AT TIME ZONE ${timezoneOffset}))::int as hour,
            COUNT(*)::bigint as count
          FROM "EventBeer"
          WHERE "eventId" = ${event.id}::uuid
            AND "userId" = ${userId}::uuid
            AND "deletedAt" IS NULL
          GROUP BY hour
          ORDER BY hour ASC
        `;

        const formattedHourlyStats: HourlyStatsDto[] = hourlyStatsRaw.map(
          (stat) => ({
            hour: Number(stat.hour),
            count: Number(stat.count),
          }),
        );

        // Calculate average per hour
        const totalHours =
          formattedHourlyStats.length > 0
            ? Math.max(...formattedHourlyStats.map((h) => h.hour)) -
              Math.min(...formattedHourlyStats.map((h) => h.hour)) +
              1
            : 1;
        const averagePerHour = totalHours > 0 ? userBeers / totalHours : 0;

        eventStats.push({
          eventId: event.id,
          eventName: event.name,
          userBeers,
          totalEventBeers,
          contribution,
          hourlyStats: formattedHourlyStats,
          averagePerHour,
        });
      }

      return {
        totalBeers,
        eventStats,
      };
    } catch (error) {
      this.logger.error('Failed to fetch personal stats', error);
      throw error;
    }
  }

  async getEventHourlyStats(
    eventId: string,
    date?: string,
  ): Promise<HourlyStatsDto[]> {
    try {
      this.logger.log(
        `Fetching hourly stats for event: ${eventId}, date: ${date || 'current day'}`,
      );

      // Get timezone offset from environment or default to UTC+2
      const timezoneOffset = process.env.TIMEZONE_OFFSET || '+02:00';

      let hourlyStatsRaw: Array<{ hour: number; count: bigint }>;

      if (date) {
        const targetDate = new Date(date);
        const startOfDay = new Date(
          targetDate.getFullYear(),
          targetDate.getMonth(),
          targetDate.getDate(),
        );
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

        hourlyStatsRaw = await this.prisma.$queryRaw<
          Array<{ hour: number; count: bigint }>
        >`
          SELECT 
            EXTRACT(HOUR FROM ("consumedAt" AT TIME ZONE ${timezoneOffset}))::int as hour,
            COUNT(*)::bigint as count
          FROM "EventBeer"
          WHERE "eventId" = ${eventId}::uuid
            AND "deletedAt" IS NULL
            AND "consumedAt" >= ${startOfDay}::timestamptz
            AND "consumedAt" < ${endOfDay}::timestamptz
          GROUP BY hour
          ORDER BY hour ASC
        `;
      } else {
        hourlyStatsRaw = await this.prisma.$queryRaw<
          Array<{ hour: number; count: bigint }>
        >`
          SELECT 
            EXTRACT(HOUR FROM ("consumedAt" AT TIME ZONE ${timezoneOffset}))::int as hour,
            COUNT(*)::bigint as count
          FROM "EventBeer"
          WHERE "eventId" = ${eventId}::uuid
            AND "deletedAt" IS NULL
          GROUP BY hour
          ORDER BY hour ASC
        `;
      }

      const formattedHourlyStats: HourlyStatsDto[] = hourlyStatsRaw.map(
        (stat) => ({
          hour: Number(stat.hour),
          count: Number(stat.count),
        }),
      );

      // Fill in missing hours with 0 count
      const allHours = Array.from({ length: 24 }, (_, i) => i);
      const existingHours = formattedHourlyStats.map((h) => h.hour);

      const missingHours = allHours.filter(
        (hour) => !existingHours.includes(hour),
      );
      const completeHourlyStats = [
        ...formattedHourlyStats,
        ...missingHours.map((hour) => ({ hour, count: 0 })),
      ].sort((a, b) => a.hour - b.hour);

      this.logger.log(
        `Hourly stats fetched: ${completeHourlyStats.length} hours with timezone offset ${timezoneOffset}`,
      );
      return completeHourlyStats;
    } catch (error) {
      this.logger.error('Failed to fetch hourly stats', error);
      throw error;
    }
  }
}
