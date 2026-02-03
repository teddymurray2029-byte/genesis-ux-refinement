import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

interface AppConfig {
  apiBaseUrl: string;
  wsUrl: string;
  theme: 'light' | 'dark' | 'system';
}

interface AppState {
  config: AppConfig;
  connectionStatus: ConnectionStatus;
  lastSyncTime: Date | null;
  setConfig: (config: Partial<AppConfig>) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setLastSyncTime: (time: Date) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      config: {
        apiBaseUrl: 'http://localhost:8000',
        wsUrl: 'ws://localhost:8000/ws',
        theme: 'dark',
      },
      connectionStatus: 'disconnected',
      lastSyncTime: null,
      setConfig: (newConfig) =>
        set((state) => ({
          config: { ...state.config, ...newConfig },
        })),
      setConnectionStatus: (status) => set({ connectionStatus: status }),
      setLastSyncTime: (time) => set({ lastSyncTime: time }),
    }),
    {
      name: 'genesis-app-config',
      partialize: (state) => ({ config: state.config }),
    }
  )
);
