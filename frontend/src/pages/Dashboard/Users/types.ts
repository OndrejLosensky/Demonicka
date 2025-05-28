import type { User } from '../../../types/user';

export interface UserTableProps {
  users: User[];
  onAddBeer: (userId: string) => Promise<void>;
  onRemoveBeer: (userId: string) => Promise<void>;
  onDelete: (userId: string) => Promise<void>;
  showGender?: boolean;
  showDeletedStatus?: boolean;
}

export interface AddUserDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingNames: string[];
} 