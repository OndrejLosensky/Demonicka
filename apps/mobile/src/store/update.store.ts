import { create } from 'zustand';

interface UpdateState {
  updateAvailable: boolean;
  showUpdateModal: boolean;

  setUpdateAvailable: (available: boolean) => void;
  setShowUpdateModal: (show: boolean) => void;
  showUpdatePrompt: () => void;
  dismissUpdatePrompt: () => void;
}

export const useUpdateStore = create<UpdateState>((set) => ({
  updateAvailable: false,
  showUpdateModal: false,

  setUpdateAvailable: (updateAvailable) => set({ updateAvailable }),
  setShowUpdateModal: (showUpdateModal) => set({ showUpdateModal }),

  showUpdatePrompt: () => set({ updateAvailable: true, showUpdateModal: true }),
  dismissUpdatePrompt: () => set({ showUpdateModal: false }),
}));
