export interface ParticipantStats {
  id: number;
  name: string;
  beerCount: number;
}

export interface BarrelStats {
  size: number;
  count: number;
}

export interface DashboardData {
  totalBeers: number;
  totalParticipants: number;
  totalBarrels: number;
  averageBeersPerParticipant: number;
  topParticipants: ParticipantStats[];
  barrelStats: BarrelStats[];
} 