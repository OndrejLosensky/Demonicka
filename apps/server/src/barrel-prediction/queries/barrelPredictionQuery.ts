import { Prisma } from '@prisma/client';

export type BarrelPredictionQueryParams = {
  eventId: string;
  windowMinutes: number;
};

/**
 * Single-query predictor inputs:
 * - Finds the active barrel for the given event
 * - Computes from-start + rolling-window pace
 * - Picks a previous ended event with at least one fully-emptied barrel of same size
 * - Computes historical Option B time-to-empty pace:
 *   - prefers same orderNumber+size, else avg of fully-emptied barrels of same size
 */
export function barrelPredictionQuery(params: BarrelPredictionQueryParams) {
  const { eventId, windowMinutes } = params;

  // Note: we build the rolling interval from an int parameter to avoid string interpolation.
  // Postgres expression: make_interval(mins => windowMinutes)
  return Prisma.sql`
WITH input AS (
  SELECT
    ${eventId}::uuid AS cur_event_id,
    ${windowMinutes}::int AS window_minutes
),
cur_event AS (
  SELECT e.id, e."startDate", e."endDate"
  FROM "Event" e
  JOIN input i ON i.cur_event_id = e.id
  WHERE e."deletedAt" IS NULL
),
cur_barrel AS (
  SELECT
    b.id,
    b."orderNumber",
    b.size,
    b."totalBeers",
    b."remainingBeers",
    b."createdAt"
  FROM input i
  JOIN "EventBarrels" eb ON eb."eventId" = i.cur_event_id
  JOIN "Barrel" b ON b.id = eb."barrelId"
  WHERE b."deletedAt" IS NULL
    AND b."isActive" = true
  ORDER BY b."createdAt" DESC
  LIMIT 1
),
asof AS (
  SELECT now() AS as_of
),
rolling_bounds AS (
  SELECT
    GREATEST(
      cb."createdAt",
      (SELECT as_of FROM asof) - make_interval(mins => (SELECT window_minutes FROM input))
    ) AS rolling_from,
    (SELECT as_of FROM asof) AS rolling_to
  FROM cur_barrel cb
),
cur_counts AS (
  SELECT
    cb.id AS cur_barrel_id,
    COUNT(*) FILTER (
      WHERE eb."deletedAt" IS NULL
        AND eb."eventId" = (SELECT cur_event_id FROM input)
        AND eb."barrelId" = cb.id
        AND eb."consumedAt" >= cb."createdAt"
        AND eb."consumedAt" < (SELECT as_of FROM asof)
    )::float AS from_start_consumed,
    COUNT(*) FILTER (
      WHERE eb."deletedAt" IS NULL
        AND eb."eventId" = (SELECT cur_event_id FROM input)
        AND eb."barrelId" = cb.id
        AND eb."consumedAt" >= (SELECT rolling_from FROM rolling_bounds)
        AND eb."consumedAt" < (SELECT rolling_to FROM rolling_bounds)
    )::float AS rolling_consumed
  FROM cur_barrel cb
  LEFT JOIN "EventBeer" eb ON eb."barrelId" = cb.id
  GROUP BY cb.id
),
prev_event AS (
  SELECT e.id, e."startDate"
  FROM "Event" e
  JOIN cur_event ce ON true
  JOIN cur_barrel cb ON true
  WHERE e."deletedAt" IS NULL
    AND e.id <> ce.id
    AND e."endDate" IS NOT NULL
    AND e."startDate" < ce."startDate"
    AND EXISTS (
      SELECT 1
      FROM "EventBarrels" eb
      JOIN "Barrel" b ON b.id = eb."barrelId"
      WHERE eb."eventId" = e.id
        AND b."deletedAt" IS NULL
        AND b.size = cb.size
        AND (
          SELECT COUNT(*)
          FROM "EventBeer" beer
          WHERE beer."eventId" = e.id
            AND beer."barrelId" = b.id
            AND beer."deletedAt" IS NULL
        ) >= b."totalBeers"
    )
  ORDER BY e."startDate" DESC
  LIMIT 1
),
prev_barrels_same_size AS (
  SELECT
    b.id AS barrel_id,
    b."orderNumber" AS order_number,
    b.size,
    b."totalBeers"::int AS total_beers,
    b."createdAt" AS started_at
  FROM prev_event pe
  JOIN "EventBarrels" eb ON eb."eventId" = pe.id
  JOIN "Barrel" b ON b.id = eb."barrelId"
  JOIN cur_barrel cb ON true
  WHERE b."deletedAt" IS NULL
    AND b.size = cb.size
),
prev_ranked AS (
  SELECT
    pbs.barrel_id,
    pbs.order_number,
    pbs.total_beers,
    pbs.started_at,
    beer."consumedAt" AS consumed_at,
    ROW_NUMBER() OVER (
      PARTITION BY pbs.barrel_id
      ORDER BY beer."consumedAt" ASC
    ) AS rn
  FROM prev_event pe
  JOIN prev_barrels_same_size pbs ON true
  JOIN "EventBeer" beer
    ON beer."eventId" = pe.id
   AND beer."barrelId" = pbs.barrel_id
   AND beer."deletedAt" IS NULL
),
prev_empty_at AS (
  SELECT
    barrel_id,
    order_number,
    total_beers,
    started_at,
    MAX(consumed_at) FILTER (WHERE rn = total_beers) AS empty_at
  FROM prev_ranked
  GROUP BY barrel_id, order_number, total_beers, started_at
),
prev_full_barrel_pace AS (
  SELECT
    barrel_id,
    order_number,
    total_beers::float AS beers_to_empty,
    EXTRACT(EPOCH FROM (empty_at - started_at))/3600.0 AS hours_to_empty,
    (total_beers::float / NULLIF(EXTRACT(EPOCH FROM (empty_at - started_at))/3600.0, 0)) AS beers_per_hour
  FROM prev_empty_at
  WHERE empty_at IS NOT NULL
),
prev_match AS (
  SELECT
    p.beers_per_hour AS match_beers_per_hour
  FROM prev_full_barrel_pace p
  JOIN cur_barrel cb ON true
  WHERE p.order_number = cb."orderNumber"
  LIMIT 1
),
prev_avg AS (
  SELECT
    AVG(beers_per_hour) AS avg_beers_per_hour,
    COUNT(*)::int AS full_barrels_used
  FROM prev_full_barrel_pace
)
SELECT
  (SELECT cur_event_id FROM input)::uuid AS "eventId",
  (SELECT as_of FROM asof) AS "asOf",

  cb.id AS "barrelId",
  cb."orderNumber" AS "barrelOrderNumber",
  cb.size AS "barrelSize",
  cb."totalBeers"::int AS "barrelTotalBeers",
  cb."remainingBeers"::int AS "barrelRemainingBeers",
  cb."createdAt" AS "barrelCreatedAt",

  (SELECT window_minutes FROM input)::int AS "windowMinutes",
  (SELECT rolling_from FROM rolling_bounds) AS "rollingFrom",
  (SELECT rolling_to FROM rolling_bounds) AS "rollingTo",

  cc.from_start_consumed AS "fromStartConsumed",
  EXTRACT(EPOCH FROM ((SELECT as_of FROM asof) - cb."createdAt"))/3600.0 AS "fromStartHoursElapsed",

  cc.rolling_consumed AS "rollingConsumed",
  EXTRACT(EPOCH FROM ((SELECT rolling_to FROM rolling_bounds) - (SELECT rolling_from FROM rolling_bounds)))/3600.0 AS "rollingHoursElapsed",

  pe.id AS "previousEventId",
  pm.match_beers_per_hour AS "previousMatchBeersPerHour",
  pa.avg_beers_per_hour AS "previousAvgBeersPerHour",
  pa.full_barrels_used AS "previousFullBarrelsUsed"
FROM cur_barrel cb
JOIN cur_counts cc ON cc.cur_barrel_id = cb.id
LEFT JOIN prev_event pe ON true
LEFT JOIN prev_match pm ON true
LEFT JOIN prev_avg pa ON true;
`;
}
