export interface Barrel {
  id: string;
  size: 15 | 30 | 50;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BarrelTableProps {
  barrels: Barrel[];
  onDelete: (barrelId: string) => Promise<void>;
  onToggleActive: (barrelId: string, isActive: boolean) => Promise<void>;
} 