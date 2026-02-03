import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useConfigStore } from '@/stores/configStore';

interface SchemaColumn {
  name: string;
  type: string;
  pk: boolean;
  notnull: boolean;
  default_value: string | null;
}

interface TableSchema {
  [tableName: string]: SchemaColumn[];
}

interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  execution_time_ms: number;
  row_count: number;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  details?: Record<string, unknown>;
}

export function useSchema() {
  const { apiBaseUrl } = useConfigStore();

  return useQuery<TableSchema>({
    queryKey: ['schema', apiBaseUrl],
    queryFn: async () => {
      const response = await fetch(`${apiBaseUrl}/schema`);
      if (!response.ok) throw new Error('Failed to fetch schema');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useHealthCheck() {
  const { apiBaseUrl } = useConfigStore();

  return useQuery({
    queryKey: ['health', apiBaseUrl],
    queryFn: async () => {
      const response = await fetch(`${apiBaseUrl}/health`);
      if (!response.ok) throw new Error('Health check failed');
      return response.json();
    },
    refetchInterval: 30000, // Every 30 seconds
  });
}

export function useQuery_(sql: string, enabled = true) {
  const { apiBaseUrl } = useConfigStore();

  return useQuery<QueryResult>({
    queryKey: ['query', sql, apiBaseUrl],
    queryFn: async () => {
      const response = await fetch(`${apiBaseUrl}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql }),
      });
      if (!response.ok) throw new Error('Query failed');
      return response.json();
    },
    enabled: enabled && sql.trim().length > 0,
  });
}

export function useExecuteQuery() {
  const { apiBaseUrl } = useConfigStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sql: string) => {
      const response = await fetch(`${apiBaseUrl}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Query execution failed');
      }
      return response.json() as Promise<QueryResult>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['query'] });
    },
  });
}

export function useLogs(limit = 100) {
  const { apiBaseUrl } = useConfigStore();

  return useQuery<LogEntry[]>({
    queryKey: ['logs', limit, apiBaseUrl],
    queryFn: async () => {
      const response = await fetch(`${apiBaseUrl}/logs?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch logs');
      return response.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });
}

export function useBrainData() {
  const { apiBaseUrl } = useConfigStore();

  return useQuery({
    queryKey: ['brain', apiBaseUrl],
    queryFn: async () => {
      const response = await fetch(`${apiBaseUrl}/brain/clusters`);
      if (!response.ok) throw new Error('Failed to fetch brain data');
      return response.json();
    },
    staleTime: 10000,
  });
}
