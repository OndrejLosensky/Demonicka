import { create } from 'zustand';
import type { ToastType } from '../components/ui/Toast';

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;

  // Actions
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
  showWarning: (message: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  visible: false,
  message: '',
  type: 'info',

  showToast: (message, type = 'info') => {
    set({ visible: true, message, type });
  },

  hideToast: () => {
    set({ visible: false });
  },

  showSuccess: (message) => {
    set({ visible: true, message, type: 'success' });
  },

  showError: (message) => {
    set({ visible: true, message, type: 'error' });
  },

  showInfo: (message) => {
    set({ visible: true, message, type: 'info' });
  },

  showWarning: (message) => {
    set({ visible: true, message, type: 'warning' });
  },
}));
