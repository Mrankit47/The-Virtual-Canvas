import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface UIState {
  theme: 'light' | 'dark';
  cursorType: 'default' | 'hover' | 'grab' | 'pencil';
  isMenuOpen: boolean;
  toasts: ToastMessage[];
  setTheme: (theme: 'light' | 'dark') => void;
  setCursorType: (type: 'default' | 'hover' | 'grab' | 'pencil') => void;
  toggleMenu: () => void;
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'light',
  cursorType: 'default',
  isMenuOpen: false,
  toasts: [],
  setTheme: (theme) => set({ theme }),
  setCursorType: (cursorType) => set({ cursorType }),
  toggleMenu: () => set((state) => ({ isMenuOpen: !state.isMenuOpen })),
  addToast: (message, type = 'info') => set((state) => {
    const id = Math.random().toString(36).substring(2, 9);
    return { toasts: [...state.toasts, { id, message, type }] };
  }),
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id),
  })),
}));
