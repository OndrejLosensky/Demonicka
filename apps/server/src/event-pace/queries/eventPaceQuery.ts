import { Prisma } from '@prisma/client';

export type EventPaceQueryParams = {
  eventId: string;
  sleepGapMinutes: number; // e.g. 90
  windowMinutes: number; // e.g. 60
};

export function eventPaceQuery(params: EventPaceQueryParams) {
  const { eventId, sleepGapMinutes, windowMinutes } = params;

  return Prisma.sql`
WITH params AS (
  SELECT
    ${eventId}::uuid AS event_id,
    ${sleepGapMinutes}::int AS sleep_gap_minutes,
    ${windowMinutes}::int AS window_minutes,
    now() AS as_of
),
participants AS (
  SELECT eu."userId"
  FROM "EventUsers" eu
  JOIN params p ON p.event_id = eu."eventId"
),
beers AS (
  SELECT eb."consumedAt"
  FROM "EventBeer" eb
  JOIN params p ON p.event_id = eb."eventId"
  JOIN participants par ON par."userId" = eb."userId"
  WHERE eb."deletedAt" IS NULL
    AND eb."spilled" = false
  ORDER BY eb."consumedAt" ASC
),
marked AS (
  SELECT
    "consumedAt",
    CASE
      WHEN lag("consumedAt") OVER (ORDER BY "consumedAt") IS NULL THEN 1
      WHEN EXTRACT(EPOCH FROM ("consumedAt" - lag("consumedAt") OVER (ORDER BY "consumedAt"))) / 60.0
           > (SELECT sleep_gap_minutes FROM params)
        THEN 1
      ELSE 0
    END AS is_new_session
  FROM beers
),
sessionized AS (
  SELECT
    "consumedAt",
    SUM(is_new_session) OVER (ORDER BY "consumedAt") AS session_id
  FROM marked
),
sessions AS (
  SELECT
    session_id,
    MIN("consumedAt") AS session_start,
    MAX("consumedAt") AS session_end,
    COUNT(*)::float AS beers_in_session
  FROM sessionized
  GROUP BY session_id
),
agg AS (
  SELECT
    (SELECT COUNT(*)::float FROM beers) AS total_beers,
    (SELECT COUNT(*)::int FROM sessions) AS sessions,
    COALESCE(SUM(EXTRACT(EPOCH FROM (session_end - session_start))) / 3600.0, 0) AS active_hours
  FROM sessions
),
cur AS (
  SELECT
    COUNT(*)::int AS beers_last_window
  FROM "EventBeer" eb
  JOIN params p ON p.event_id = eb."eventId"
  JOIN participants par ON par."userId" = eb."userId"
  WHERE eb."deletedAt" IS NULL
    AND eb."spilled" = false
    AND eb."consumedAt" >= (SELECT as_of FROM params) - make_interval(mins => (SELECT window_minutes FROM params))
    AND eb."consumedAt" < (SELECT as_of FROM params)
)
SELECT
  (SELECT as_of FROM params) AS "asOf",
  (SELECT sleep_gap_minutes FROM params)::int AS "sleepGapMinutes",
  (SELECT window_minutes FROM params)::int AS "windowMinutes",

  COALESCE((SELECT total_beers FROM agg), 0)::int AS "totalNonSpilledBeers",
  COALESCE((SELECT sessions FROM agg), 0)::int AS "sessions",
  COALESCE((SELECT active_hours FROM agg), 0)::float AS "activeHours",
  CASE
    WHEN COALESCE((SELECT active_hours FROM agg), 0) > 0
      THEN (COALESCE((SELECT total_beers FROM agg), 0) / NULLIF((SELECT active_hours FROM agg), 0))
    ELSE NULL
  END AS "avgBeersPerActiveHour",

  (SELECT beers_last_window FROM cur) AS "beersLastWindow",
  ((SELECT beers_last_window FROM cur)::float / NULLIF(((SELECT window_minutes FROM params)::float / 60.0), 0)) AS "currentBeersPerHour";
`;
}

