import { apiClient } from '../utils/apiClient';
import { notify } from '../notifications/notify';

// Add response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle network errors (no response)
    if (!error?.response) {
      notify.error('Chyba připojení k serveru', { id: 'api:network' });
      return Promise.reject(error);
    }

    // Let the AuthContext handle 401 errors
    if (error.response.status === 401) {
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export { apiClient as api }; 