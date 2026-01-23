export type BarrelStatus = 'ACTIVE' | 'INACTIVE';

export interface Barrel {
  id: string;
  size: number;
  isActive: boolean;
  remainingBeers: number;
  totalBeers: number;
  remainingLitres: number;
  totalLitres: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  orderNumber: number;
}
