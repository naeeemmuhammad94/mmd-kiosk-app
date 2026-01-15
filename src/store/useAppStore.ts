import { create } from 'zustand';

interface AppState {
  isLoading: boolean;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  setLoading: (loading: boolean) => void;
  setUser: (user: AppState['user']) => void;
  clearUser: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isLoading: false,
  user: null,
  setLoading: (loading) => set({ isLoading: loading }),
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
