import { useState, useMemo } from 'react';
import { useLogs } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Search, RefreshCw, AlertCircle, AlertTriangle, Info, Bug } from 'lucide-react';
import { format } from 'date-fns';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  source: string;
  metadata?: Record<string, unknown>;
}

const levelConfig: Record<LogLevel, { icon: typeof Info; color: string; bgColor: string }> = {
  info: { icon: Info, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  warn: { icon: AlertTriangle, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
  error: { icon: AlertCircle, color: 'text-red-500', bgColor: 'bg-red-500/10' },
  debug: { icon: Bug, color: 'text-gray-500', bgColor: 'bg-gray-500/10' },
};

// Demo logs for when backend isn't connected
const DEMO_LOGS: LogEntry[] = [
  { id: '1', timestamp: new Date().toISOString(), level: 'info', message: 'Genesis system initialized', source: 'core' },
  { id: '2', timestamp: new Date(Date.now() - 60000).toISOString(), level: 'info', message: 'WebSocket connection established', source: 'websocket' },
  { id: '3', timestamp: new Date(Date.now() - 120000).toISOString(), level: 'warn', message: 'High memory usage detected in cluster 42', source: 'memory' },
  { id: '4', timestamp: new Date(Date.now() - 180000).toISOString(), level: 'error', message: 'Failed to sync with external data source', source: 'sync' },
  { id: '5', timestamp: new Date(Date.now() - 240000).toISOString(), level: 'debug', message: 'Query execution completed in 42ms', source: 'database' },
  { id: '6', timestamp: new Date(Date.now() - 300000).toISOString(), level: 'info', message: 'Neural pathway optimization completed', source: 'optimizer' },
  { id: '7', timestamp: new Date(Date.now() - 360000).toISOString(), level: 'info', message: 'New memory cluster created', source: 'memory' },
  { id: '8', timestamp: new Date(Date.now() - 420000).toISOString(), level: 'warn', message: 'Connection latency above threshold', source: 'network' },
];

export default function Logs() {
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: logs, isLoading, refetch } = useLogs({
    level: levelFilter === 'all' ? undefined : levelFilter,
  });

  const displayLogs = logs ?? DEMO_LOGS;

  const filteredLogs = useMemo(() => {
    return displayLogs.filter((log) => {
      const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
      const matchesSearch =
        !debouncedSearch ||
        log.message.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        log.source.toLowerCase().includes(debouncedSearch.toLowerCase());
      return matchesLevel && matchesSearch;
    });
  }, [displayLogs, levelFilter, debouncedSearch]);

  const handleLogClick = (log: LogEntry) => {
    setSelectedLog(log);
    setIsDetailOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Logs</h1>
          <p className="text-muted-foreground">
            Monitor and debug Genesis system activity
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warn">Warning</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="debug">Debug</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Log Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {(['info', 'warn', 'error', 'debug'] as const).map((level) => {
          const config = levelConfig[level];
          const count = displayLogs.filter((l) => l.level === level).length;
          const Icon = config.icon;
          
          return (
            <Card
              key={level}
              className={cn(
                'cursor-pointer transition-colors hover:border-primary/50',
                levelFilter === level && 'border-primary'
              )}
              onClick={() => setLevelFilter(level === levelFilter ? 'all' : level)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className={cn('rounded-lg p-2', config.bgColor)}>
                  <Icon className={cn('h-5 w-5', config.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground capitalize">{level}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Log Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Log Entries</CardTitle>
          <CardDescription>
            {filteredLogs.length} entries • Auto-refreshes every 5 seconds
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Level</TableHead>
                    <TableHead className="w-[180px]">Timestamp</TableHead>
                    <TableHead className="w-[120px]">Source</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => {
                      const config = levelConfig[log.level];
                      const Icon = config.icon;
                      
                      return (
                        <TableRow
                          key={log.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleLogClick(log)}
                        >
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={cn('gap-1', config.bgColor, config.color)}
                            >
                              <Icon className="h-3 w-3" />
                              {log.level}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.source}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[400px] truncate">
                            {log.message}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        No logs found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Detail Drawer */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Log Details</SheetTitle>
            <SheetDescription>
              Full log entry information
            </SheetDescription>
          </SheetHeader>
          {selectedLog && (
            <div className="mt-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Level</label>
                <Badge
                  variant="secondary"
                  className={cn(
                    'gap-1',
                    levelConfig[selectedLog.level].bgColor,
                    levelConfig[selectedLog.level].color
                  )}
                >
                  {selectedLog.level}
                </Badge>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Timestamp</label>
                <p className="font-mono text-sm">
                  {format(new Date(selectedLog.timestamp), 'yyyy-MM-dd HH:mm:ss.SSS')}
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Source</label>
                <p className="text-sm">{selectedLog.source}</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Message</label>
                <p className="text-sm">{selectedLog.message}</p>
              </div>
              {selectedLog.metadata && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Metadata</label>
                  <pre className="rounded-md bg-muted p-3 text-xs overflow-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
