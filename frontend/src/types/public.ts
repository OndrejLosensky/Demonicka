export interface PublicParticipant {
  name: string;
  beerCount: number;
}

export interface BarrelStats {
  size: number;
  count: number;
}

export interface PublicStats {
  totalBeers: number;
  totalParticipants: number;
  totalBarrels: number;
  topParticipants: PublicParticipant[];
  barrelStats: BarrelStats[];
} 