export interface Barrel {
  id: string;
  size: 15 | 30 | 50;
  isActive: boolean;
  orderNumber: number;
  remainingBeers: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
} 