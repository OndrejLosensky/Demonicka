export class UserStatsDto {
  id: string;
  name: string;
  beerCount: number;
}

export class BarrelStatsDto {
  size: number;
  count: number;
}

export class DashboardResponseDto {
  totalBeers: number;
  totalUsers: number;
  totalBarrels: number;
  averageBeersPerUser: number;
  topUsers: UserStatsDto[];
  barrelStats: BarrelStatsDto[];
}
