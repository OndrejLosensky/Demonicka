import type { User } from './user';
import type { Barrel } from './barrel';

export interface Event {
    id: string;
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    registrationEnabled?: boolean;
    registrationToken?: string | null;
    beerPongEnabled?: boolean;
    beerSizesEnabled?: boolean;
    beerPrice?: number;
    createdBy: string | null;
    users: User[];
    barrels: Barrel[];
    createdAt: string;
    updatedAt: string;
    deletedAt?: string;
}

export interface CreateEventDto {
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
}
