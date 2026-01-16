import type { User } from '@demonicka/shared-types';
import type { Barrel } from './barrel';

export interface Event {
    id: string;
    name: string;
    description?: string;
    startDate: string;
    endDate?: string;
    isActive: boolean;
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
    endDate?: string;
} 