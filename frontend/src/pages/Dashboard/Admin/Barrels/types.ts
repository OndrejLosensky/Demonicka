import type { Barrel as MainBarrel } from '../../../../types/barrel';

export type { MainBarrel as Barrel };

export interface BarrelTableProps {
  barrels: MainBarrel[];
  onDelete: (id: string) => Promise<void>;
  onToggleActive?: (id: string) => Promise<void>;
  showDeletedStatus?: boolean;
}

export interface UseBarrelsReturn {
  barrels: MainBarrel[];
  isLoading: boolean;
  handleDelete: (id: string) => Promise<void>;
  handleToggleActive: (id: string, isActive: boolean) => Promise<void>;
  handleCleanup: () => Promise<void>;
  fetchBarrels: () => Promise<void>;
} 