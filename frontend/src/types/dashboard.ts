export interface UserStats {
  id: string;
  name: string;
  beerCount: number;
}

export interface BarrelStats {
  size: number;
  count: number;
}

export interface DashboardStats {
  totalBeers: number;
  totalUsers: number;
  totalBarrels: number;
  averageBeersPerUser: number;
  topUsers: UserStats[];
  barrelStats: BarrelStats[];
} 