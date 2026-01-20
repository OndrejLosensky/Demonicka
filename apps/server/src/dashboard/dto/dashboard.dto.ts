export class UserStatsDto {
  id: string;
  username: string;
  beerCount: number;
  profilePictureUrl?: string | null;
}

export class BarrelStatsDto {
  size: number;
  count: number;
}

export class BarrelPredictionCurrentPaceDto {
  methodUsed: 'rolling_window' | 'from_start';
  windowMinutes: number;
  minConsumed: number;
  minElapsedMinutes: number;

  fromStart: {
    startedAt: string;
    consumed: number;
    hoursElapsed: number;
    beersPerHour: number | null;
  };

  rollingWindow: {
    from: string;
    to: string;
    consumed: number;
    hoursElapsed: number;
    beersPerHour: number | null;
  };
}

export class BarrelPredictionHistoricalPaceDto {
  previousEventId: string | null;
  matchingStrategy: 'same_index_size' | 'avg_same_size' | null;
  fullBarrelsUsed: number;
  beersPerHour: number | null;
}

export class BarrelPredictionDto {
  asOf: string;
  status: 'ok' | 'warming_up' | 'no_active_barrel' | 'no_history';

  barrel: {
    id: string;
    orderNumber: number;
    size: number;
    totalBeers: number;
    remainingBeers: number;
    createdAt: string;
  };

  current: BarrelPredictionCurrentPaceDto;
  historical: BarrelPredictionHistoricalPaceDto;

  eta: {
    emptyAtByCurrent: string | null;
    emptyAtByHistorical: string | null;
  };
}

export class DashboardResponseDto {
  totalBeers: number;
  totalUsers: number;
  totalBarrels: number;
  averageBeersPerUser: number;
  topUsers: UserStatsDto[];
  barrelStats: BarrelStatsDto[];
  barrelPrediction?: BarrelPredictionDto;
}
