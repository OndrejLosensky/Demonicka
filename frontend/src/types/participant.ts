export interface Participant {
    id: string;
    name: string;
    gender: 'MALE' | 'FEMALE';
    beerCount: number;
    lastBeerTime: string | null;
    createdAt: string;
    updatedAt: string;
} 