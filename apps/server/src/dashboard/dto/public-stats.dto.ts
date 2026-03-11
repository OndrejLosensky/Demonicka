export class PublicStatsDto {
  totalBeers: number;
  totalUsers: number;
  totalBarrels: number;
  totalEventsFinished: number;
  totalBeerPongGamesPlayed: number;
  topUsers: {
    username: string;
    beerCount: number;
  }[];
  barrelStats: {
    size: number;
    count: number;
  }[];
}
