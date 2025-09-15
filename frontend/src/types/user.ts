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
    spilledBeerCount: number;
    lastBeerTime: string | null;
    registrationToken: string | null;
    isRegistrationComplete: boolean;
    profilePicture: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
} 