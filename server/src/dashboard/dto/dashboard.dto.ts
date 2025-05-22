export class ParticipantStatsDto {
  id: string;
  name: string;
  beerCount: number;
}

export class BarrelStatsDto {
  size: number;
  count: number;
}

export class DashboardResponseDto {
  totalBeers: number;
  totalParticipants: number;
  totalBarrels: number;
  averageBeersPerParticipant: number;
  topParticipants: ParticipantStatsDto[];
  barrelStats: BarrelStatsDto[];
}
