import { create } from 'zustand';

type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting' | 'error';

interface ConnectionState {
  status: ConnectionStatus;
  lastSync: Date | null;
  errorMessage: string | null;
  setStatus: (status: ConnectionStatus) => void;
  setLastSync: (date: Date) => void;
  setError: (message: string | null) => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  status: 'disconnected',
  lastSync: null,
  errorMessage: null,
  setStatus: (status) => set({ status }),
  setLastSync: (date) => set({ lastSync: date }),
  setError: (message) => set({ errorMessage: message }),
}));
