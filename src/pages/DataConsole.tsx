import { useState, useMemo, useCallback } from 'react';
import { useSchema, useExecuteQuery } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { toast } from 'sonner';
import { Search, Play, Download, RefreshCw, Database, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

const ROWS_PER_PAGE = 20;

export default function DataConsole() {
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sqlQuery, setSqlQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRow, setSelectedRow] = useState<Record<string, unknown> | null>(null);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: schema, isLoading: schemaLoading } = useSchema();
  const executeQuery = useExecuteQuery();

  // Auto-generate SELECT query when table changes
  const autoQuery = useMemo(() => {
    if (!selectedTable) return '';
    return `SELECT * FROM ${selectedTable} LIMIT 100`;
  }, [selectedTable]);

  // Execute query when table is selected or SQL is run
  const { data: queryResult, isLoading: queryLoading, refetch } = useExecuteQuery().mutate
    ? { data: null, isLoading: false, refetch: () => {} }
    : { data: null, isLoading: false, refetch: () => {} };

  const handleRunQuery = useCallback(() => {
    const query = sqlQuery || autoQuery;
    if (!query) {
      toast.error('No query to execute');
      return;
    }
    executeQuery.mutate(query, {
      onSuccess: (data) => {
        toast.success(`Query executed in ${data.executionTime}ms`);
      },
      onError: (error) => {
        toast.error(`Query failed: ${error.message}`);
      },
    });
  }, [sqlQuery, autoQuery, executeQuery]);

  // Filter rows based on search
  const filteredRows = useMemo(() => {
    if (!executeQuery.data?.rows) return [];
    if (!debouncedSearch) return executeQuery.data.rows;

    return executeQuery.data.rows.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    );
  }, [executeQuery.data?.rows, debouncedSearch]);

  // Paginate rows
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredRows.slice(start, start + ROWS_PER_PAGE);
  }, [filteredRows, currentPage]);

  const totalPages = Math.ceil(filteredRows.length / ROWS_PER_PAGE);

  const handleExportCSV = useCallback(() => {
    if (!executeQuery.data?.rows || executeQuery.data.rows.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = executeQuery.data.columns.join(',');
    const rows = filteredRows.map((row) =>
      executeQuery.data!.columns.map((col) => JSON.stringify(row[col] ?? '')).join(',')
    );
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTable || 'export'}_${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Data exported successfully');
  }, [executeQuery.data, filteredRows, selectedTable]);

  const handleRowClick = useCallback((row: Record<string, unknown>) => {
    setSelectedRow(row);
    setIsEditDrawerOpen(true);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Console</h1>
          <p className="text-muted-foreground">
            Browse, query, and manage your Genesis memory data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Table Selector & SQL Editor */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tables</CardTitle>
            <CardDescription>Select a table to browse</CardDescription>
          </CardHeader>
          <CardContent>
            {schemaLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <div className="space-y-1">
                {schema?.map((table) => (
                  <button
                    key={table.name}
                    onClick={() => {
                      setSelectedTable(table.name);
                      setSqlQuery('');
                      setCurrentPage(1);
                    }}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent',
                      selectedTable === table.name && 'bg-accent font-medium'
                    )}
                  >
                    <Database className="h-4 w-4 text-muted-foreground" />
                    {table.name}
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {table.columns.length} cols
                    </Badge>
                  </button>
                )) ?? (
                  <p className="text-sm text-muted-foreground">
                    No tables found. Connect to your backend to see tables.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">SQL Query</CardTitle>
            <CardDescription>Write custom queries or use auto-generated ones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder={autoQuery || 'SELECT * FROM table_name WHERE ...'}
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              className="min-h-[100px] font-mono text-sm"
            />
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {executeQuery.data?.executionTime && (
                  <span>Last query: {executeQuery.data.executionTime}ms</span>
                )}
              </div>
              <Button onClick={handleRunQuery} disabled={executeQuery.isPending}>
                <Play className="mr-2 h-4 w-4" />
                {executeQuery.isPending ? 'Running...' : 'Run Query'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">
                {selectedTable || 'Results'}
              </CardTitle>
              <CardDescription>
                {filteredRows.length} rows
                {debouncedSearch && ` (filtered from ${executeQuery.data?.rows?.length ?? 0})`}
              </CardDescription>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Filter results..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {queryLoading || executeQuery.isPending ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : executeQuery.data?.columns ? (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {executeQuery.data.columns.map((col) => (
                        <TableHead key={col} className="whitespace-nowrap">
                          {col}
                        </TableHead>
                      ))}
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRows.length > 0 ? (
                      paginatedRows.map((row, idx) => (
                        <TableRow
                          key={idx}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleRowClick(row)}
                        >
                          {executeQuery.data!.columns.map((col) => (
                            <TableCell key={col} className="max-w-[200px] truncate">
                              {String(row[col] ?? '')}
                            </TableCell>
                          ))}
                          <TableCell>
                            <Edit className="h-4 w-4 text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={executeQuery.data.columns.length + 1}
                          className="h-24 text-center"
                        >
                          {debouncedSearch
                            ? 'No matching results'
                            : 'No data available'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </p>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          className={cn(currentPage === 1 && 'pointer-events-none opacity-50')}
                        />
                      </PaginationItem>
                      {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                        const page = i + 1;
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          className={cn(
                            currentPage === totalPages && 'pointer-events-none opacity-50'
                          )}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            <div className="flex h-48 flex-col items-center justify-center text-center">
              <Database className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">
                Select a table or run a query to view data
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Drawer */}
      <Sheet open={isEditDrawerOpen} onOpenChange={setIsEditDrawerOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Edit Record</SheetTitle>
            <SheetDescription>
              View and modify the selected record
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {selectedRow &&
              Object.entries(selectedRow).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <label className="text-sm font-medium">{key}</label>
                  <Input
                    defaultValue={String(value ?? '')}
                    className="font-mono text-sm"
                  />
                </div>
              ))}
            <div className="flex gap-2 pt-4">
              <Button className="flex-1">Save Changes</Button>
              <Button variant="outline" onClick={() => setIsEditDrawerOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
