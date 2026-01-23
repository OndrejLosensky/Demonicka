export interface UserLeaderboardData {
  id: string;
  username: string;
  gender: 'MALE' | 'FEMALE';
  beerCount: number;
  spilledCount: number;
  totalLitres: number;
  rank: number;
  profilePictureUrl?: string | null;
}

export interface LeaderboardData {
  males: UserLeaderboardData[];
  females: UserLeaderboardData[];
}
