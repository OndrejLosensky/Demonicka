import type { User } from './user';
import type { Event } from './event';
import type { Barrel } from './barrel';

export interface EventBeer {
    id: string;
    eventId: string;
    userId: string;
    barrelId?: string | null;
    event?: Event;
    user?: User;
    barrel?: Barrel | null;
    consumedAt: string;
    deletedAt?: string | null;
} 