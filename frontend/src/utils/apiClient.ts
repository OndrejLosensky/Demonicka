import axios, { AxiosError } from 'axios';
import { config } from '../config';
import { toast } from 'react-hot-toast';

const API_URL = `${config.apiUrl}${config.apiPrefix}`;

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (error: AxiosError) => void }[] = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as string);
    }
  });
  failedQueue = [];
};

// Add request interceptor for auth token
apiClient.interceptors.request.use(
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

// Add response interceptor for token refresh and error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle network errors
    if (!error.response) {
      toast.error('Chyba připojení k serveru');
      return Promise.reject(error);
    }

    // If the error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If the request was for refresh token and it failed, clear everything
      if (originalRequest.url === '/auth/refresh') {
        localStorage.removeItem('access_token');
        processQueue(error, null);
        return Promise.reject(error);
      }

      if (isRefreshing) {
        try {
          const token = await new Promise<string>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await apiClient.post('/auth/refresh');
        const { accessToken } = response.data;
        
        localStorage.setItem('access_token', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        processQueue(null, accessToken);
        
        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        processQueue(refreshError as AxiosError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle other errors (but not 401, which is handled above)
    if (error.response.status !== 401) {
      switch (error.response.status) {
        case 403:
          toast.error('Nemáte oprávnění k této akci');
          break;
        case 404:
          toast.error('Požadovaný zdroj nebyl nalezen');
          break;
        case 409:
          toast.error('Došlo ke konfliktu při zpracování požadavku');
          break;
        case 500:
          toast.error('Chyba serveru');
          break;
        default:
          toast.error('Neočekávaná chyba');
      }
    }

    return Promise.reject(error);
  }
); 