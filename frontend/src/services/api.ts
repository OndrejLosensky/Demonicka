import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Optionally handle 401 errors (e.g., redirect to login)
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
); 