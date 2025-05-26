import axios from 'axios';
import type { Participant } from '../types/participant';
import { API_URL } from '../config';

// Create an axios instance with proper configuration
const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

export const participantsService = {
    async getAllParticipants(): Promise<Participant[]> {
        const response = await api.get('/participants');
        return response.data;
    },

    async getParticipant(id: string): Promise<Participant> {
        const response = await api.get(`/participants/${id}`);
        return response.data;
    },

    async createParticipant(participant: { name: string; gender: 'MALE' | 'FEMALE' }): Promise<Participant> {
        const response = await api.post('/participants', participant);
        return response.data;
    },

    async updateParticipant(id: string, participant: Partial<Participant>): Promise<Participant> {
        const response = await api.patch(`/participants/${id}`, participant);
        return response.data;
    },

    async deleteParticipant(id: string): Promise<void> {
        await api.delete(`/participants/${id}`);
    }
}; 