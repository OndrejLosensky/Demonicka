import type { User } from './user';
import type { Barrel } from './barrel';
import type { EventBeer } from './event-beer';

export interface Event {
    id: string;
    name: string;
    description?: string;
    startDate: string;
    endDate?: string | null;
    isActive: boolean;
    users: User[];
    barrels: Barrel[];
    eventBeers: EventBeer[];
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
}

export interface CreateEventDto {
    name: string;
    description?: string;
    startDate: string;
    endDate?: string;
} 