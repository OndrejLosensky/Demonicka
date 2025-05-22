export class ParticipantLeaderboardDto {
  id: string;
  name: string;
  beerCount: number;
  gender: 'MALE' | 'FEMALE';
}

export class LeaderboardDto {
  males: ParticipantLeaderboardDto[];
  females: ParticipantLeaderboardDto[];
}
