export class PublicStatsDto {
  totalBeers: number;
  totalParticipants: number;
  totalBarrels: number;
  topParticipants: {
    name: string;
    beerCount: number;
  }[];
  barrelStats: {
    size: number;
    count: number;
  }[];
}
