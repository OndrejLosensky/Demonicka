export interface Barrel {
  id: string;
  size: 15 | 30 | 50;
  isActive: boolean;
  orderNumber: number;
  remainingBeers: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface BarrelTableProps {
  barrels: Barrel[];
  onDelete: (id: string) => Promise<void>;
  onToggleActive: (id: string) => Promise<void>;
  showDeletedStatus?: boolean;
}

export interface UseBarrelsReturn {
  barrels: Barrel[];
  isLoading: boolean;
  handleDelete: (id: string) => Promise<void>;
  handleToggleActive: (id: string, isActive: boolean) => Promise<void>;
  handleCleanup: () => Promise<void>;
  fetchBarrels: () => Promise<void>;
} 