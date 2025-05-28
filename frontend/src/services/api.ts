import axios from 'axios';
import { toast } from 'react-hot-toast';
import translations from '../locales/cs/common.json';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create an axios instance with proper configuration
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for handling errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const response = await api.post('/auth/refresh');
        const { access_token } = response.data;
        
        // Save the new token
        localStorage.setItem('access_token', access_token);
        
        // Update the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (!error.response) {
      toast.error(translations.errors.network.default);
      return Promise.reject(error);
    }

    switch (error.response.status) {
      case 401:
        toast.error(translations.errors.network.unauthorized);
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

export default api; 