import axios from 'axios';
import type { Event, CreateEventDto } from '../types/event';
import { API_URL } from '../config';

// Create an axios instance with proper configuration
const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

export const eventService = {
    async createEvent(event: CreateEventDto): Promise<Event> {
        const response = await api.post('/events', event);
        return response.data;
    },

    async getAllEvents(): Promise<Event[]> {
        const response = await api.get('/events');
        return response.data;
    },

    async getEvent(id: string): Promise<Event> {
        const response = await api.get(`/events/${id}`);
        return response.data;
    },

    async getActiveEvent(): Promise<Event | null> {
        const response = await api.get('/events/active');
        return response.data;
    },

    async addParticipant(eventId: string, participantId: string): Promise<Event> {
        const response = await api.put(`/events/${eventId}/participants/${participantId}`, {});
        return response.data;
    },

    async addBarrel(eventId: string, barrelId: string): Promise<Event> {
        const response = await api.put(`/events/${eventId}/barrels/${barrelId}`, {});
        return response.data;
    },

    async endEvent(id: string): Promise<Event> {
        const response = await api.put(`/events/${id}/end`, {});
        return response.data;
    }
}; 