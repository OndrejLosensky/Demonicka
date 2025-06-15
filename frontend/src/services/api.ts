import { apiClient } from '../utils/apiClient';
import { toast } from 'react-hot-toast';

// Add response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle network errors
    if (!error.response) {
      toast.error('Chyba připojení k serveru');
      return Promise.reject(error);
    }

    // Let the AuthContext handle 401 errors
    if (error.response.status === 401) {
      return Promise.reject(error);
    }

    // Handle other errors
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

    return Promise.reject(error);
  }
);

export { apiClient as api }; 