import { api } from './api';
import type { Event, User } from '@demonicka/shared-types';

export const eventService = {
    async getAllEvents(): Promise<Event[]> {
        const response = await api.get('/events');
        return response.data;
    },

    async getEvent(id: string): Promise<Event> {
        const response = await api.get(`/events/${id}`);
        return response.data;
    },

    async createEvent(data: { name: string; description?: string; startDate: string; endDate?: string }): Promise<Event> {
        const response = await api.post('/events', data);
        return response.data;
    },

    async updateEvent(id: string, data: Partial<Event>): Promise<Event> {
        const response = await api.put(`/events/${id}`, data);
        return response.data;
    },

    async deleteEvent(id: string): Promise<void> {
        await api.delete(`/events/${id}`);
    },

    async getActiveEvent(): Promise<Event | null> {
        try {
            const response = await api.get('/events/active');
            return response.data;
        } catch {
            return null;
        }
    },

    async setActive(id: string): Promise<Event> {
        const response = await api.put(`/events/${id}/active`);
        return response.data;
    },

    async deactivate(id: string): Promise<Event> {
        const response = await api.delete(`/events/${id}/active`);
        return response.data;
    },

    async endEvent(id: string): Promise<Event> {
        const response = await api.put(`/events/${id}/end`);
        return response.data;
    },

    async addUser(id: string, userId: string): Promise<Event> {
        const response = await api.put(`/events/${id}/users/${userId}`);
        return response.data;
    },

    async removeUser(id: string, userId: string): Promise<Event> {
        try {
            const response = await api.delete(`/events/${id}/users/${userId}`);
            return response.data;
        } catch (error) {
            console.error('removeUser error:', error);
            throw error;
        }
    },

    async addBarrel(id: string, barrelId: string): Promise<Event> {
        const response = await api.put(`/events/${id}/barrels/${barrelId}`);
        return response.data;
    },

    async removeBarrel(id: string, barrelId: string): Promise<Event> {
        const response = await api.delete(`/events/${id}/barrels/${barrelId}`);
        return response.data;
    },

    async getEventUsers(id: string): Promise<User[]> {
        const response = await api.get(`/events/${id}/users`);
        return response.data;
    },

    async getUserEventBeerCount(eventId: string, userId: string): Promise<number> {
        const response = await api.get(`/events/${eventId}/users/${userId}/beers/count`);
        return response.data;
    },

    async addBeerToUser(eventId: string, userId: string): Promise<void> {
        await api.post(`/events/${eventId}/users/${userId}/beers`);
    },

    async removeBeerFromUser(eventId: string, userId: string): Promise<void> {
        await api.delete(`/events/${eventId}/users/${userId}/beers`);
    },

    async downloadEventDetailExcel(eventId: string): Promise<Blob> {
        const response = await api.get(`/events/${eventId}/export/excel/detail`, {
            responseType: 'blob',
            headers: {
                Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
        });
        return response.data as Blob;
    },
}; 