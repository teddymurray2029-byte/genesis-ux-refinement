import { useState, useMemo, useCallback } from 'react';
import { Search, Download, Plus, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useSchema, useQuery_ } from '@/hooks/useApi';
import { SqlQueryEditor } from './SqlQueryEditor';
import { RecordEditDrawer } from './RecordEditDrawer';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

const PAGE_SIZES = [10, 25, 50, 100];

export function DataConsole() {
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [filterText, setFilterText] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedRow, setSelectedRow] = useState<Record<string, unknown> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showQueryEditor, setShowQueryEditor] = useState(false);

  const debouncedFilter = useDebounce(filterText, 300);

  const { data: schema, isLoading: schemaLoading, refetch: refetchSchema } = useSchema();

  const tables = useMemo(() => {
    return schema ? Object.keys(schema) : [];
  }, [schema]);

  // Select first table by default
  useMemo(() => {
    if (tables.length > 0 && !selectedTable) {
      setSelectedTable(tables[0]);
    }
  }, [tables, selectedTable]);

  const columns = useMemo(() => {
    if (!schema || !selectedTable) return [];
    return schema[selectedTable] || [];
  }, [schema, selectedTable]);

  const sql = useMemo(() => {
    if (!selectedTable) return '';
    const offset = (page - 1) * pageSize;
    let query = `SELECT * FROM ${selectedTable}`;
    if (debouncedFilter) {
      // Simple text search across all columns
      const conditions = columns
        .map((col) => `CAST(${col.name} AS TEXT) LIKE '%${debouncedFilter}%'`)
        .join(' OR ');
      query += ` WHERE ${conditions}`;
    }
    query += ` LIMIT ${pageSize} OFFSET ${offset}`;
    return query;
  }, [selectedTable, page, pageSize, debouncedFilter, columns]);

  const { data: queryResult, isLoading: dataLoading, refetch: refetchData } = useQuery_(sql, !!selectedTable);

  const rows = queryResult?.rows || [];
  const totalRows = queryResult?.row_count || 0;
  const totalPages = Math.ceil(totalRows / pageSize) || 1;

  const handleTableChange = useCallback((table: string) => {
    setSelectedTable(table);
    setPage(1);
    setFilterText('');
    setSelectedRow(null);
  }, []);

  const handleRowClick = useCallback((row: Record<string, unknown>) => {
    setSelectedRow(row);
  }, []);

  const handleExportCsv = useCallback(() => {
    if (!rows.length || !columns.length) return;
    
    const headers = columns.map((c) => c.name).join(',');
    const csvRows = rows.map((row) =>
      columns.map((c) => {
        const val = row[c.name];
        if (val === null || val === undefined) return '';
        const str = String(val);
        return str.includes(',') ? `"${str}"` : str;
      }).join(',')
    );
    
    const csv = [headers, ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTable}_export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [rows, columns, selectedTable]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Console</h1>
          <p className="text-muted-foreground">Browse and manage your database tables</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowQueryEditor(!showQueryEditor)}>
            SQL Editor
          </Button>
          <Button variant="outline" size="icon" onClick={() => { refetchSchema(); refetchData(); }}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {showQueryEditor && (
        <SqlQueryEditor onClose={() => setShowQueryEditor(false)} />
      )}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Select value={selectedTable} onValueChange={handleTableChange}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select table" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((table) => (
                    <SelectItem key={table} value={table}>
                      {table}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTable && (
                <span className="text-sm text-muted-foreground">
                  {columns.length} columns
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter records..."
                  value={filterText}
                  onChange={(e) => { setFilterText(e.target.value); setPage(1); }}
                  className="w-[200px] pl-8"
                />
              </div>
              <Button variant="outline" size="icon" onClick={handleExportCsv} disabled={!rows.length}>
                <Download className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={() => { setSelectedRow({}); setIsEditing(true); }}>
                <Plus className="mr-1 h-4 w-4" />
                Add Record
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {schemaLoading || dataLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !selectedTable ? (
            <div className="flex h-40 items-center justify-center text-muted-foreground">
              Select a table to view data
            </div>
          ) : rows.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
              <p>No records found</p>
              {filterText && (
                <Button variant="ghost" size="sm" onClick={() => setFilterText('')}>
                  Clear filter
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((col) => (
                      <TableHead key={col.name} className="whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {col.name}
                          {col.pk && (
                            <span className="rounded bg-primary/10 px-1 text-xs text-primary">PK</span>
                          )}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, idx) => (
                    <TableRow
                      key={idx}
                      className={cn(
                        'cursor-pointer',
                        selectedRow === row && 'bg-muted'
                      )}
                      onClick={() => handleRowClick(row)}
                    >
                      {columns.map((col) => (
                        <TableCell key={col.name} className="max-w-[200px] truncate">
                          {row[col.name] === null ? (
                            <span className="text-muted-foreground italic">null</span>
                          ) : (
                            String(row[col.name])
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {rows.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Rows per page:</span>
                <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZES.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <RecordEditDrawer
        open={isEditing || !!selectedRow}
        onClose={() => { setSelectedRow(null); setIsEditing(false); }}
        record={selectedRow}
        columns={columns}
        tableName={selectedTable}
        isNew={isEditing && !selectedRow?.id}
      />
    </div>
  );
}
