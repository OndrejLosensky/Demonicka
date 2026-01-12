import type { ReactNode } from 'react';

export interface UserLeaderboard {
  id: string;
  username: string;
  beerCount: number;
}

export interface LeaderboardTableProps {
  participants: UserLeaderboard[];
  title: string;
  icon?: ReactNode;
}

export interface LeaderboardData {
  males: UserLeaderboard[];
  females: UserLeaderboard[];
} 