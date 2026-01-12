import { UserRole } from '@prisma/client';

export class TimeDistributionDto {
  hour: number;
  count: number;
}

export class DailyStatsDto {
  date: string;
  count: number;
}

export class EventStatsDto {
  eventId: string;
  eventName: string;
  beerCount: number;
  rank: number;
  totalParticipants: number;
}

export class UserStatsDto {
  // Basic Info
  userId: string;
  username: string;
  name: string | null;
  role: UserRole;
  createdAt: Date;

  // Overall Stats
  totalBeers: number;
  averageBeersPerDay: number;
  averageBeersPerEvent: number;
  beersLastHour: number;
  beersToday: number;
  beersThisWeek: number;
  beersThisMonth: number;
  
  // Time-based Stats
  firstBeerDate: Date | null;
  lastBeerDate: Date | null;
  longestBreak: number; // in hours
  mostBeersInDay: number;
  
  // Distribution
  hourlyDistribution: TimeDistributionDto[];
  dailyStats: DailyStatsDto[];
  
  // Event Stats
  eventStats: EventStatsDto[];
  
  // Rankings
  globalRank: number;
  totalUsers: number;
  percentile: number;
} 