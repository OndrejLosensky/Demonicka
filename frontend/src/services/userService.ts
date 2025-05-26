import axios from 'axios';
import type { User } from '../types/user';
import { API_URL } from '../config';

const USERS_URL = `${API_URL}/users`;

export const userService = {
    async getAllUsers(): Promise<User[]> {
        const response = await axios.get(USERS_URL);
        return response.data;
    }
}; 