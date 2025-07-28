export interface HourlyStatsDto {
  hour: number;
  count: number;
}

export interface EventStatsDto {
  eventId: string;
  eventName: string;
  userBeers: number;
  totalEventBeers: number;
  contribution: number;
  hourlyStats: HourlyStatsDto[];
  averagePerHour: number;
}

export interface PersonalStatsDto {
  totalBeers: number;
  eventStats: EventStatsDto[];
} 