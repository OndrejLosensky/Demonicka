export class UserLeaderboardDto {
  id: string;
  name: string;
  gender: 'MALE' | 'FEMALE';
  beerCount: number;
}

export class LeaderboardDto {
  males: UserLeaderboardDto[];
  females: UserLeaderboardDto[];
}
