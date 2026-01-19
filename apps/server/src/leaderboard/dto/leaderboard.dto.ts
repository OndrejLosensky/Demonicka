export class LeaderboardEntryDto {
  id: string;
  username: string;
  name: string | null;
  beerCount: number;
  lastBeerTime: Date | null;
}
