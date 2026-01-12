export class PublicStatsDto {
  totalBeers: number;
  totalUsers: number;
  totalBarrels: number;
  topUsers: {
    username: string;
    beerCount: number;
  }[];
  barrelStats: {
    size: number;
    count: number;
  }[];
}
