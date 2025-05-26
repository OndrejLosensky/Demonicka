import type { Participant } from './participant';
import type { Barrel } from './barrel';

export interface Event {
    id: string;
    name: string;
    description?: string;
    startDate: string;
    endDate?: string;
    isActive: boolean;
    participants: Participant[];
    barrels: Barrel[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateEventDto {
    name: string;
    description?: string;
    startDate: string;
} 