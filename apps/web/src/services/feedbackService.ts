import { api } from './api';

export const feedbackApi = {
  submit: (message: string, source: 'web' | 'mobile' = 'web') =>
    api.post<{ id: string }>('/feedback', { message, source }).then((r) => r.data),
};
