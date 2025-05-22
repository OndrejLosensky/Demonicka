export class ParticipantLeaderboardDto {
  id: number;
  name: string;
  beerCount: number;
  gender: 'MALE' | 'FEMALE';
}

export class LeaderboardDto {
  males: ParticipantLeaderboardDto[];
  females: ParticipantLeaderboardDto[];
}
