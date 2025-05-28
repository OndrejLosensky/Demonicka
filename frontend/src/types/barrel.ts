export type BarrelStatus = 'FULL' | 'TAPPED' | 'EMPTY';

export interface Barrel {
  id: string;
  size: number;
  brand: string;
  status: BarrelStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
} 