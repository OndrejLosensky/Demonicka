export interface Participant {
  id: string;
  username: string;
  name: string | null;
  gender: 'MALE' | 'FEMALE';
  role: 'SUPER_ADMIN' | 'OPERATOR' | 'USER' | 'PARTICIPANT';
  beerCount: number;  // Global beer count
  eventBeerCount?: number;  // Event-specific beer count
  eventNonSpilledBeerCount?: number; // Event-specific score (non-spilled)
  eventSpilledBeerCount?: number; // Event-specific spilled beers
  lastBeerTime: string | null;
  profilePictureUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ParticipantTableProps {
  participants: Participant[];
  deletedParticipants: Participant[];
  showDeleted: boolean;
  showUserHistory?: boolean;
  onAddBeer: (participantId: string, beerSize?: 'SMALL' | 'LARGE', volumeLitres?: number) => Promise<void>;
  onAddSpilledBeer?: (participantId: string) => Promise<void>;
  onRemoveBeer: (participantId: string) => Promise<void>;
  onDelete: (participantId: string) => Promise<void>;
  onRestore: (participantId: string) => Promise<void>;
  onShowHistory?: (participantId: string, username: string) => void;
}

export interface AddParticipantDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingUsernames: string[];
} 