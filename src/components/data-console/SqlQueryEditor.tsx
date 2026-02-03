import { useState } from 'react';
import { Play, X, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useExecuteQuery } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';

interface SqlQueryEditorProps {
  onClose: () => void;
}

export function SqlQueryEditor({ onClose }: SqlQueryEditorProps) {
  const [sql, setSql] = useState('SELECT * FROM ');
  const { toast } = useToast();
  const { mutate: executeQuery, data: result, isPending, error, reset } = useExecuteQuery();

  const handleExecute = () => {
    if (!sql.trim()) return;
    executeQuery(sql, {
      onSuccess: (data) => {
        toast({
          title: 'Query executed',
          description: `${data.row_count} rows returned in ${data.execution_time_ms}ms`,
        });
      },
      onError: (err) => {
        toast({
          title: 'Query failed',
          description: err.message,
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">SQL Query Editor</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          placeholder="Enter your SQL query..."
          className="min-h-[100px] font-mono text-sm"
        />
        <div className="flex items-center gap-2">
          <Button onClick={handleExecute} disabled={isPending || !sql.trim()}>
            <Play className="mr-1 h-4 w-4" />
            {isPending ? 'Running...' : 'Execute'}
          </Button>
          {result && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>{result.row_count} rows</span>
              <Clock className="h-4 w-4" />
              <span>{result.execution_time_ms}ms</span>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error.message}</span>
            </div>
          )}
        </div>

        {result && result.rows.length > 0 && (
          <div className="max-h-[300px] overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {result.columns.map((col) => (
                    <TableHead key={col}>{col}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.rows.slice(0, 100).map((row, idx) => (
                  <TableRow key={idx}>
                    {result.columns.map((col) => (
                      <TableCell key={col} className="max-w-[150px] truncate">
                        {row[col] === null ? (
                          <span className="italic text-muted-foreground">null</span>
                        ) : (
                          String(row[col])
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
