import { api } from './api';

export interface EventRegistrationInfo {
  eventName: string;
  registrationEnabled: boolean;
}

export interface CreateRegistrationDto {
  rawName: string;
  participating: boolean;
  arrivalTime?: string;
  leaveTime?: string;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  rawName: string;
  participating: boolean;
  arrivalTime?: string;
  leaveTime?: string;
  matchedUserId?: string;
  matchConfidence?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  matchedUser?: {
    id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    username?: string;
  };
  suggestedMatch?: {
    id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    username?: string;
  } | null;
  suggestedConfidence?: number;
}

export const eventRegistrationService = {
  async getEventByToken(token: string): Promise<EventRegistrationInfo> {
    const response = await api.get(`/registration/by-token/${token}`);
    return response.data;
  },

  async createRegistration(token: string, data: CreateRegistrationDto) {
    const response = await api.post(`/registration/by-token/${token}`, data);
    return response.data;
  },

  async getRegistrations(eventId: string): Promise<EventRegistration[]> {
    const response = await api.get(`/events/${eventId}/registration`);
    return response.data;
  },

  async getRegistrationsWithSuggestions(eventId: string): Promise<EventRegistration[]> {
    const response = await api.get(`/events/${eventId}/registration/review`);
    return response.data;
  },

  async updateRegistration(
    eventId: string,
    registrationId: string,
    data: Partial<EventRegistration>,
  ) {
    const response = await api.patch(`/events/${eventId}/registration/${registrationId}`, data);
    return response.data;
  },

  async applyRegistrations(eventId: string): Promise<{ applied: number }> {
    const response = await api.post(`/events/${eventId}/registration/apply`);
    return response.data;
  },
};
