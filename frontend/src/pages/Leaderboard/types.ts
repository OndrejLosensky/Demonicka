export interface UserLeaderboard {
  id: number;
  name: string;
  beerCount: number;
  gender: 'MALE' | 'FEMALE';
}

export interface LeaderboardTableProps {
  users: UserLeaderboard[];
  title: string;
} 