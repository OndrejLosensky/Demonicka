import axios from 'axios';
import type { Event, CreateEventDto } from '../types/event';
import { API_URL } from '../config';

const EVENTS_URL = `${API_URL}/events`;

const config = {
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
};

export const eventService = {
    async createEvent(event: CreateEventDto): Promise<Event> {
        const response = await axios.post(EVENTS_URL, event, config);
        return response.data;
    },

    async getAllEvents(): Promise<Event[]> {
        const response = await axios.get(EVENTS_URL, config);
        return response.data;
    },

    async getEvent(id: string): Promise<Event> {
        const response = await axios.get(`${EVENTS_URL}/${id}`, config);
        return response.data;
    },

    async addParticipant(eventId: string, userId: string): Promise<Event> {
        const response = await axios.put(`${EVENTS_URL}/${eventId}/participants/${userId}`, {}, config);
        return response.data;
    },

    async addBarrel(eventId: string, barrelId: string): Promise<Event> {
        const response = await axios.put(`${EVENTS_URL}/${eventId}/barrels/${barrelId}`, {}, config);
        return response.data;
    },

    async endEvent(id: string): Promise<Event> {
        const response = await axios.put(`${EVENTS_URL}/${id}/end`, {}, config);
        return response.data;
    }
}; 