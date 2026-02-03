import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ConfigState {
  apiBaseUrl: string;
  wsBaseUrl: string;
  theme: 'light' | 'dark' | 'system';
  setApiBaseUrl: (url: string) => void;
  setWsBaseUrl: (url: string) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      apiBaseUrl: 'http://localhost:8000',
      wsBaseUrl: 'ws://localhost:8000/ws',
      theme: 'dark',
      setApiBaseUrl: (url) => set({ apiBaseUrl: url }),
      setWsBaseUrl: (url) => set({ wsBaseUrl: url }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'genesis-config',
    }
  )
);
