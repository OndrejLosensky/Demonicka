export interface Participant {
  id: string;
  username: string;
  name: string | null;
  gender: 'MALE' | 'FEMALE';
  role: 'ADMIN' | 'USER' | 'PARTICIPANT';
  beerCount: number;  // Global beer count
  eventBeerCount?: number;  // Event-specific beer count
  spilledBeerCount?: number;  // Event-specific spilled beer count
  lastBeerTime: string | null;
  profilePicture: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ParticipantTableProps {
  participants: Participant[];
  deletedParticipants: Participant[];
  showDeleted: boolean;
  onAddBeer: (participantId: string) => Promise<void>;
  onRemoveBeer: (participantId: string) => Promise<void>;
  onAddSpilledBeer: (participantId: string) => Promise<void>;
  onDelete: (participantId: string) => Promise<void>;
}

export interface AddParticipantDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingUsernames: string[];
} 