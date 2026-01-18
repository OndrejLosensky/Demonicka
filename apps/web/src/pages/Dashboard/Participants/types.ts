export interface Participant {
  id: string;
  username: string;
  name: string | null;
  gender: 'MALE' | 'FEMALE';
  role: 'SUPER_ADMIN' | 'OPERATOR' | 'USER' | 'PARTICIPANT';
  beerCount: number;  // Global beer count
  eventBeerCount?: number;  // Event-specific beer count
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
  onAddBeer: (participantId: string) => Promise<void>;
  onRemoveBeer: (participantId: string) => Promise<void>;
  onDelete: (participantId: string) => Promise<void>;
}

export interface AddParticipantDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingUsernames: string[];
} 