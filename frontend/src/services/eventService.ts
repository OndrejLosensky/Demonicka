import { api } from './api';
import type { Event } from '../types/event';

export const eventService = {
    async getAllEvents(): Promise<Event[]> {
        const response = await api.get('/events');
        return response.data;
    },

    async getEvent(id: string): Promise<Event> {
        const response = await api.get(`/events/${id}`);
        return response.data;
    },

    async createEvent(event: Partial<Event>): Promise<Event> {
        const response = await api.post('/events', event);
        return response.data;
    },

    async updateEvent(id: string, event: Partial<Event>): Promise<Event> {
        const response = await api.patch(`/events/${id}`, event);
        return response.data;
    },

    async deleteEvent(id: string): Promise<void> {
        await api.delete(`/events/${id}`);
    },

    async addUser(id: string, userId: string): Promise<Event> {
        const response = await api.post(`/events/${id}/users/${userId}`);
        return response.data;
    },

    async removeUser(id: string, userId: string): Promise<Event> {
        const response = await api.delete(`/events/${id}/users/${userId}`);
        return response.data;
    },

    async addBarrel(id: string, barrelId: string): Promise<Event> {
        const response = await api.post(`/events/${id}/barrels/${barrelId}`);
        return response.data;
    },

    async removeBarrel(id: string, barrelId: string): Promise<Event> {
        const response = await api.delete(`/events/${id}/barrels/${barrelId}`);
        return response.data;
    },

    async setActive(id: string): Promise<Event> {
        const response = await api.post(`/events/${id}/active`);
        return response.data;
    },

    async endEvent(id: string): Promise<Event> {
        const response = await api.post(`/events/${id}/end`);
        return response.data;
    },

    async getActiveEvent(): Promise<Event | null> {
        const response = await api.get('/events/active');
        return response.data;
    },

    async makeEventActive(id: string): Promise<Event> {
        const response = await api.put(`/events/${id}/activate`);
        return response.data;
    }
}; 