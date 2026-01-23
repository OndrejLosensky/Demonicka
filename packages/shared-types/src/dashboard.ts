export interface UserStats {
  id: string;
  username: string;
  name: string | null;
  beerCount: number;
  lastBeerTime: string | null;
  profilePictureUrl?: string | null;
}

export interface BarrelStats {
  size: number;
  count: number;
}

export type BarrelPredictionMethod = 'rolling_window' | 'from_start';
export type BarrelPredictionStatus =
  | 'ok'
  | 'warming_up'
  | 'no_active_barrel'
  | 'no_history';

export interface BarrelPredictionCurrentPace {
  methodUsed: BarrelPredictionMethod;
  windowMinutes: number;
  minConsumed: number;
  minElapsedMinutes: number;

  fromStart: {
    startedAt: string; // ISO
    consumed: number;
    hoursElapsed: number;
    beersPerHour: number | null;
    litresPerHour: number | null;
  };

  rollingWindow: {
    from: string; // ISO
    to: string; // ISO
    consumed: number;
    hoursElapsed: number;
    beersPerHour: number | null;
    litresPerHour: number | null;
  };
}

export interface BarrelPredictionHistoricalPace {
  previousEventId: string | null;
  matchingStrategy: 'same_index_size' | 'avg_same_size' | null;
  fullBarrelsUsed: number;
  beersPerHour: number | null;
  litresPerHour: number | null;
}

export interface BarrelPrediction {
  asOf: string; // ISO
  status: BarrelPredictionStatus;

  barrel: {
    id: string;
    orderNumber: number;
    size: number;
    totalBeers: number;
    remainingBeers: number;
    totalLitres: number;
    remainingLitres: number;
    createdAt: string; // ISO
  };

  current: BarrelPredictionCurrentPace;
  historical: BarrelPredictionHistoricalPace;

  eta: {
    emptyAtByCurrent: string | null; // ISO
    emptyAtByHistorical: string | null; // ISO
  };
}

export interface EventPace {
  asOf: string; // ISO
  sleepGapMinutes: number; // e.g. 90
  windowMinutes: number; // e.g. 60
  totalNonSpilledBeers: number;
  totalNonSpilledLitres: number;
  sessions: number;
  activeHours: number;
  avgBeersPerActiveHour: number | null;
  avgLitresPerActiveHour: number | null;
  beersLastWindow: number;
  litresLastWindow: number;
  currentBeersPerHour: number;
  currentLitresPerHour: number;
}

export interface DashboardStats {
  totalBeers: number;
  totalLitres: number;
  totalUsers: number;
  totalBarrels: number;
  averageBeersPerUser: number;
  averageLitresPerUser: number;
  topUsers: UserStats[];
  barrelStats: BarrelStats[];
  barrelPrediction?: BarrelPrediction;
  eventPace?: EventPace;
}
