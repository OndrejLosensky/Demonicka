export interface ParticipantLeaderboard {
  id: number;
  name: string;
  beerCount: number;
  gender: 'MALE' | 'FEMALE';
}

export interface LeaderboardData {
  males: ParticipantLeaderboard[];
  females: ParticipantLeaderboard[];
}

export interface LeaderboardTableProps {
  participants: ParticipantLeaderboard[];
  title: string;
} 