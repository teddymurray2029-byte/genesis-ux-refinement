import { useState, useMemo } from 'react';
import { Search, RefreshCw, AlertCircle, Info, AlertTriangle, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { useLogs } from '@/hooks/useApi';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

type LogLevel = 'all' | 'info' | 'warn' | 'error';

const levelConfig = {
  info: { icon: Info, color: 'bg-blue-500/10 text-blue-500', label: 'Info' },
  warn: { icon: AlertTriangle, color: 'bg-yellow-500/10 text-yellow-500', label: 'Warning' },
  error: { icon: AlertCircle, color: 'bg-destructive/10 text-destructive', label: 'Error' },
};

function LogsPage() {
  const [filterText, setFilterText] = useState('');
  const [levelFilter, setLevelFilter] = useState<LogLevel>('all');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  const debouncedFilter = useDebounce(filterText, 300);

  const { data: logs, isLoading, refetch } = useLogs(500);

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    
    return logs.filter((log) => {
      const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
      const matchesText = !debouncedFilter || 
        log.message.toLowerCase().includes(debouncedFilter.toLowerCase()) ||
        log.id.toLowerCase().includes(debouncedFilter.toLowerCase());
      return matchesLevel && matchesText;
    });
  }, [logs, levelFilter, debouncedFilter]);

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedLogs(newExpanded);
  };

  const levelCounts = useMemo(() => {
    if (!logs) return { info: 0, warn: 0, error: 0 };
    return logs.reduce(
      (acc, log) => {
        acc[log.level] = (acc[log.level] || 0) + 1;
        return acc;
      },
      { info: 0, warn: 0, error: 0 } as Record<string, number>
    );
  }, [logs]);

  // Generate demo logs if API doesn't return data
  const displayLogs = useMemo(() => {
    if (filteredLogs.length > 0) return filteredLogs;
    
    // Demo logs
    const demoLevels: Array<'info' | 'warn' | 'error'> = ['info', 'warn', 'error'];
    return Array.from({ length: 20 }, (_, i) => ({
      id: `log-${i}`,
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      level: demoLevels[i % 3],
      message: [
        'WebSocket connection established',
        'Query execution slow (>100ms)',
        'Failed to parse incoming message',
        'Schema refresh completed',
        'Memory cluster activation spike detected',
      ][i % 5],
      details: i % 2 === 0 ? { query: 'SELECT * FROM memories', duration_ms: 45 + i * 10 } : undefined,
    }));
  }, [filteredLogs]);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">System Logs</h1>
            <p className="text-muted-foreground">
              Monitor system activity and troubleshoot issues
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {Object.entries(levelCounts).map(([level, count]) => {
            const config = levelConfig[level as keyof typeof levelConfig];
            const Icon = config.icon;
            return (
              <Card key={level} className="cursor-pointer hover:bg-muted/50" onClick={() => setLevelFilter(level as LogLevel)}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={cn('rounded-full p-2', config.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-sm text-muted-foreground">{config.label} logs</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">Log Entries</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="w-[200px] pl-8"
                  />
                </div>
                <Select value={levelFilter} onValueChange={(v) => setLevelFilter(v as LogLevel)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warn">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : displayLogs.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-muted-foreground">
                No logs found
              </div>
            ) : (
              <div className="space-y-2">
                {displayLogs.map((log) => {
                  const config = levelConfig[log.level];
                  const Icon = config.icon;
                  const isExpanded = expandedLogs.has(log.id);

                  return (
                    <Collapsible key={log.id} open={isExpanded} onOpenChange={() => toggleExpanded(log.id)}>
                      <div className="rounded-md border">
                        <CollapsibleTrigger asChild>
                          <div className="flex cursor-pointer items-center gap-3 p-3 hover:bg-muted/50">
                            <div className={cn('rounded-full p-1', config.color)}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="truncate text-sm">{log.message}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(log.timestamp).toLocaleString()}
                              </p>
                            </div>
                            <Badge variant="outline" className={config.color}>
                              {log.level}
                            </Badge>
                            <ChevronDown className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')} />
                          </div>
                        </CollapsibleTrigger>
                        {log.details && (
                          <CollapsibleContent>
                            <div className="border-t bg-muted/30 p-3">
                              <pre className="text-xs font-mono overflow-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          </CollapsibleContent>
                        )}
                      </div>
                    </Collapsible>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default LogsPage;
