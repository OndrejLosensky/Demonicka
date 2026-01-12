export interface UserLeaderboardData {
  id: string;
  username: string;
  gender: 'MALE' | 'FEMALE';
  beerCount: number;
}

export interface LeaderboardData {
  males: UserLeaderboardData[];
  females: UserLeaderboardData[];
}
