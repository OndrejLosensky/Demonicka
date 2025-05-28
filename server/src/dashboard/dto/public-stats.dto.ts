export class PublicStatsDto {
  totalBeers: number;
  totalUsers: number;
  totalBarrels: number;
  topUsers: {
    name: string;
    beerCount: number;
  }[];
  barrelStats: {
    size: number;
    count: number;
  }[];
}
