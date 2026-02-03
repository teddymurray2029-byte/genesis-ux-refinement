import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/stores/appStore';

interface SchemaColumn {
  name: string;
  type: string;
  nullable: boolean;
  primary_key: boolean;
}

interface SchemaTable {
  name: string;
  columns: SchemaColumn[];
}

interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  executionTime: number;
}

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  database: boolean;
  websocket: boolean;
  uptime: number;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source: string;
  metadata?: Record<string, unknown>;
}

async function fetchWithError(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export function useSchema() {
  const { config } = useAppStore();

  return useQuery<SchemaTable[]>({
    queryKey: ['schema'],
    queryFn: () => fetchWithError(`${config.apiBaseUrl}/schema`),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useQuery_(sql: string, enabled = true) {
  const { config } = useAppStore();

  return useQuery<QueryResult>({
    queryKey: ['query', sql],
    queryFn: () =>
      fetchWithError(`${config.apiBaseUrl}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql }),
      }),
    enabled: enabled && sql.length > 0,
  });
}

export function useExecuteQuery() {
  const { config } = useAppStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sql: string) =>
      fetchWithError(`${config.apiBaseUrl}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql }),
      }),
    onSuccess: () => {
      // Invalidate all query caches on mutation
      queryClient.invalidateQueries({ queryKey: ['query'] });
    },
  });
}

export function useHealth() {
  const { config } = useAppStore();

  return useQuery<HealthStatus>({
    queryKey: ['health'],
    queryFn: () => fetchWithError(`${config.apiBaseUrl}/health`),
    refetchInterval: 30000, // Check every 30 seconds
    retry: 1,
  });
}

export function useLogs(filters?: { level?: string; since?: string; limit?: number }) {
  const { config } = useAppStore();
  const params = new URLSearchParams();
  if (filters?.level) params.set('level', filters.level);
  if (filters?.since) params.set('since', filters.since);
  if (filters?.limit) params.set('limit', filters.limit.toString());

  return useQuery<LogEntry[]>({
    queryKey: ['logs', filters],
    queryFn: () => fetchWithError(`${config.apiBaseUrl}/logs?${params.toString()}`),
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });
}

export function useBrainData() {
  const { config } = useAppStore();

  return useQuery<{
    clusters: Array<{
      id: string;
      position: [number, number, number];
      size: number;
      intensity: number;
      connections: string[];
    }>;
    totalMemories: number;
    activeConnections: number;
  }>({
    queryKey: ['brain-data'],
    queryFn: () => fetchWithError(`${config.apiBaseUrl}/brain/visualization`),
    refetchInterval: 10000,
  });
}
