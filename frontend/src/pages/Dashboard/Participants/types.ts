export interface Participant {
  id: string;
  username: string;
  name: string;
  gender: 'MALE' | 'FEMALE';
  beerCount: number;  // Global beer count
  eventBeerCount?: number;  // Event-specific beer count
  lastBeerTime: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ParticipantTableProps {
  participants: Participant[];
  onAddBeer: (participantId: string) => Promise<void>;
  onRemoveBeer: (participantId: string) => Promise<void>;
  onDelete: (participantId: string) => Promise<void>;
  showGender?: boolean;
  showDeletedStatus?: boolean;
} 