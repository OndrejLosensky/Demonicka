export interface Barrel {
  id: string;
  size: 15 | 30 | 50;
  isActive: boolean;
  orderNumber: number;
  remainingBeers: number;
  createdAt: string;
  updatedAt: string;
}

export interface BarrelTableProps {
  barrels: Barrel[];
  onDelete: (barrelId: string) => Promise<void>;
  onToggleActive: (barrelId: string, isActive: boolean) => Promise<void>;
}

export interface UseBarrelsReturn {
  barrels: Barrel[];
  isLoading: boolean;
  handleDelete: (id: string) => Promise<void>;
  handleToggleActive: (id: string, isActive: boolean) => Promise<void>;
  handleCleanup: () => Promise<void>;
  fetchBarrels: () => Promise<void>;
} 