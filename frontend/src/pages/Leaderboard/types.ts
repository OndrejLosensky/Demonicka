export interface UserLeaderboard {
  id: number;
  username: string;
  beerCount: number;
  gender: 'MALE' | 'FEMALE';
}

export interface LeaderboardTableProps {
  participants: UserLeaderboard[];
  title: string;
} 