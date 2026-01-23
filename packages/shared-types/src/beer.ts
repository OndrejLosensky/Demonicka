// Beer type definitions

export type BeerSize = 'SMALL' | 'LARGE';

export interface Beer {
  id: string;
  userId: string;
  barrelId?: string | null;
  beerSize: BeerSize;
  volumeLitres: number;
  createdAt: string;
  deletedAt?: string | null;
}

export interface EventBeer {
  id: string;
  eventId: string;
  userId: string;
  barrelId?: string | null;
  spilled: boolean;
  beerSize: BeerSize;
  volumeLitres: number;
  consumedAt: string;
  deletedAt?: string | null;
}
