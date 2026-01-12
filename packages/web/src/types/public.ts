export interface PublicUser {
  name: string;
  beerCount: number;
}

export interface BarrelStats {
  size: number;
  count: number;
}

export interface ActivityEvent {
  id: string;
  type: 'beer_added' | 'barrel_finished' | 'achievement_unlocked' | 'new_user';
  userName: string;
  timestamp: string;
  details: {
    beerCount?: number;
    barrelName?: string;
    achievementName?: string;
  };
}

export interface PublicStats {
  totalBeers: number;
  totalUsers: number;
  totalBarrels: number;
  topUsers: Array<{
    name: string;
    beerCount: number;
  }>;
  barrelStats: Array<{
    size: number;
    count: number;
  }>;
  latestActivity: ActivityEvent[];
} 