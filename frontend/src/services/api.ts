import axios from 'axios';
import { toast } from 'react-hot-toast';
import translations from '../locales/cs/common.api.json';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response) {
      toast.error(translations.errors.network.default);
      return Promise.reject(error);
    }

    switch (error.response.status) {
      case 401:
        toast.error(translations.errors.network.unauthorized);
        window.location.href = '/login';
        break;
      case 403:
        toast.error(translations.errors.network.forbidden);
        break;
      case 404:
        toast.error(translations.errors.network.notFound);
        break;
      case 409:
        toast.error(translations.errors.network.conflict);
        break;
      case 500:
        toast.error(translations.errors.network.server);
        break;
      default:
        toast.error(translations.errors.network.unknown);
    }

    return Promise.reject(error);
  }
); 