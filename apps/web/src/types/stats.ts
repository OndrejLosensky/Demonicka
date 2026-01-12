export interface TimeDistribution {
  hour: number;
  count: number;
}

export interface DailyStats {
  date: string;
  count: number;
}

export interface EventStats {
  eventId: string;
  eventName: string;
  beerCount: number;
  rank: number;
  totalParticipants: number;
}

export interface UserStats {
  // Basic Info
  userId: string;
  username: string;
  name: string;
  role: string;
  createdAt: string;

  // Overall Stats
  totalBeers: number;
  averageBeersPerDay: number;
  averageBeersPerEvent: number;
  beersLastHour: number;
  beersToday: number;
  beersThisWeek: number;
  beersThisMonth: number;

  // Time-based Stats
  firstBeerDate: string | null;
  lastBeerDate: string | null;
  longestBreak: number;
  mostBeersInDay: number;

  // Distribution
  hourlyDistribution: TimeDistribution[];
  dailyStats: DailyStats[];

  // Event Stats
  eventStats: EventStats[];

  // Rankings
  globalRank: number;
  totalUsers: number;
  percentile: number;
} 