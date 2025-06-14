export type BarrelStatus = 'ACTIVE' | 'INACTIVE';

export interface Barrel {
  id: string;
  size: number;
  brand: string;
  status: BarrelStatus;
  beersLeft: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
} 