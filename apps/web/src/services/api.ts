import { apiClient } from '../utils/apiClient';

// Add response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Let the AuthContext handle 401 errors
    if (error.response.status === 401) {
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export { apiClient as api }; 