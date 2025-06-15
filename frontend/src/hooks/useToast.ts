import { toast } from 'react-hot-toast';

interface ToastOptions {
  duration?: number;
}

export const useToast = () => {
  const success = (message: string, options?: ToastOptions) => {
    toast.success(message, {
      duration: options?.duration || 3000,
      style: { background: '#10B981', color: 'white' }
    });
  };

  const error = (message: string, options?: ToastOptions) => {
    toast.error(message, {
      duration: options?.duration || 4000,
      style: { background: '#EF4444', color: 'white' }
    });
  };

  const warning = (message: string, options?: ToastOptions) => {
    toast(message, {
      duration: options?.duration || 4000,
      icon: '⚠️',
      style: { background: '#F59E0B', color: 'white' }
    });
  };

  return {
    success,
    error,
    warning
  };
}; 