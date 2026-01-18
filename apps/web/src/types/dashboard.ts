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

export interface DashboardStats {
  totalBeers: number;
  totalUsers: number;
  totalBarrels: number;
  averageBeersPerUser: number;
  topUsers: UserStats[];
  barrelStats: BarrelStats[];
} 