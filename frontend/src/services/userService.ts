import axios from 'axios';
import type { User } from '../types/user';
import { API_URL } from '../config';

// Create an axios instance with proper configuration
const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

export const userService = {
    async getAllUsers(): Promise<User[]> {
        const response = await api.get('/users');
        return response.data;
    }
}; 