export interface PublicParticipant {
  name: string;
  beerCount: number;
}

export interface BarrelStats {
  size: number;
  count: number;
}

export interface ActivityEvent {
  id: string;
  type: 'beer_added' | 'barrel_finished' | 'achievement_unlocked' | 'new_participant';
  participantName: string;
  timestamp: string;
  details: {
    beerCount?: number;
    barrelName?: string;
    achievementName?: string;
  };
}

export interface PublicStats {
  totalBeers: number;
  totalParticipants: number;
  totalBarrels: number;
  topParticipants: Array<{
    name: string;
    beerCount: number;
  }>;
  latestActivity: ActivityEvent[];
} 