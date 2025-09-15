export class UserStatsDto {
  id: string;
  username: string;
  beerCount: number;
  profilePicture: string | null;
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
