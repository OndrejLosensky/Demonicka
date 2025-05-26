import axios from 'axios';
import type { Barrel } from '../types/barrel';
import { API_URL } from '../config';

const BARRELS_URL = `${API_URL}/barrels`;

export const barrelService = {
    async getAllBarrels(): Promise<Barrel[]> {
        const response = await axios.get(BARRELS_URL);
        return response.data;
    }
}; 