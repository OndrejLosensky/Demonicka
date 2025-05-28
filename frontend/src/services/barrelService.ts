import axios from 'axios';
import type { Barrel } from '../types/barrel';
import { API_URL } from '../config';

// Create an axios instance with proper configuration
const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

export const barrelService = {
    async getAllBarrels(): Promise<Barrel[]> {
        const response = await api.get('/barrels');
        return response.data;
    }
}; 