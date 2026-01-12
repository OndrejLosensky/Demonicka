export const USER_ROLE = {
  ADMIN: 'ADMIN',
  USER: 'USER',
  PARTICIPANT: 'PARTICIPANT',
} as const;

export type UserRole = typeof USER_ROLE[keyof typeof USER_ROLE];

export interface User {
    id: string;
    username: string;
    name: string;
    firstName: string | null;
    lastName: string | null;
    gender: 'MALE' | 'FEMALE';
    role: UserRole;
    beerCount: number;
    lastBeerTime: string | null;
    registrationToken: string | null;
    isRegistrationComplete: boolean;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}
