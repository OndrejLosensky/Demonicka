export class UserLeaderboardDto {
  id: string;
  username: string;
  gender: 'MALE' | 'FEMALE';
  beerCount: number;
  rank: number;
  profilePictureUrl?: string | null;
}

export class LeaderboardDto {
  males: UserLeaderboardDto[];
  females: UserLeaderboardDto[];
}
