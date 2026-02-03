import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, Trash2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useExecuteQuery } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface SchemaColumn {
  name: string;
  type: string;
  pk: boolean;
  notnull: boolean;
  default_value: string | null;
}

interface RecordEditDrawerProps {
  open: boolean;
  onClose: () => void;
  record: Record<string, unknown> | null;
  columns: SchemaColumn[];
  tableName: string;
  isNew?: boolean;
}

export function RecordEditDrawer({
  open,
  onClose,
  record,
  columns,
  tableName,
  isNew = false,
}: RecordEditDrawerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mutate: executeQuery, isPending } = useExecuteQuery();

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: record || {},
  });

  useEffect(() => {
    if (record) {
      reset(record);
    } else {
      reset({});
    }
  }, [record, reset]);

  const onSubmit = (data: Record<string, unknown>) => {
    let sql: string;

    if (isNew) {
      const cols = Object.keys(data).filter((k) => data[k] !== undefined);
      const vals = cols.map((k) => {
        const val = data[k];
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
        return String(val);
      });
      sql = `INSERT INTO ${tableName} (${cols.join(', ')}) VALUES (${vals.join(', ')})`;
    } else {
      const pkCol = columns.find((c) => c.pk);
      if (!pkCol) {
        toast({ title: 'Error', description: 'No primary key found', variant: 'destructive' });
        return;
      }
      const updates = Object.entries(data)
        .filter(([key]) => key !== pkCol.name)
        .map(([key, val]) => {
          if (val === null || val === undefined) return `${key} = NULL`;
          if (typeof val === 'string') return `${key} = '${val.replace(/'/g, "''")}'`;
          return `${key} = ${val}`;
        });
      sql = `UPDATE ${tableName} SET ${updates.join(', ')} WHERE ${pkCol.name} = '${data[pkCol.name]}'`;
    }

    executeQuery(sql, {
      onSuccess: () => {
        toast({ title: isNew ? 'Record created' : 'Record updated' });
        queryClient.invalidateQueries({ queryKey: ['query'] });
        onClose();
      },
      onError: (err) => {
        toast({ title: 'Error', description: err.message, variant: 'destructive' });
      },
    });
  };

  const handleDelete = () => {
    const pkCol = columns.find((c) => c.pk);
    if (!pkCol || !record) return;

    const sql = `DELETE FROM ${tableName} WHERE ${pkCol.name} = '${record[pkCol.name]}'`;
    executeQuery(sql, {
      onSuccess: () => {
        toast({ title: 'Record deleted' });
        queryClient.invalidateQueries({ queryKey: ['query'] });
        onClose();
      },
      onError: (err) => {
        toast({ title: 'Error', description: err.message, variant: 'destructive' });
      },
    });
  };

  const getInputType = (sqlType: string) => {
    const type = sqlType.toLowerCase();
    if (type.includes('int') || type.includes('real') || type.includes('float')) return 'number';
    if (type.includes('bool')) return 'checkbox';
    if (type.includes('text') || type.includes('json')) return 'textarea';
    return 'text';
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>{isNew ? 'Add New Record' : 'Edit Record'}</SheetTitle>
          <SheetDescription>
            {isNew ? `Create a new record in ${tableName}` : `Modify record in ${tableName}`}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          {columns.map((col) => {
            const inputType = getInputType(col.type);

            return (
              <div key={col.name} className="space-y-2">
                <Label htmlFor={col.name} className="flex items-center gap-2">
                  {col.name}
                  {col.pk && (
                    <span className="rounded bg-primary/10 px-1 text-xs text-primary">PK</span>
                  )}
                  {col.notnull && !col.pk && (
                    <span className="text-xs text-destructive">*</span>
                  )}
                </Label>
                {inputType === 'textarea' ? (
                  <Textarea
                    id={col.name}
                    {...register(col.name)}
                    disabled={col.pk && !isNew}
                    placeholder={col.default_value || ''}
                    className="font-mono text-sm"
                  />
                ) : inputType === 'checkbox' ? (
                  <Checkbox
                    id={col.name}
                    checked={!!watch(col.name)}
                    onCheckedChange={(checked) => setValue(col.name, checked)}
                    disabled={col.pk && !isNew}
                  />
                ) : (
                  <Input
                    id={col.name}
                    type={inputType}
                    {...register(col.name)}
                    disabled={col.pk && !isNew}
                    placeholder={col.default_value || ''}
                  />
                )}
                <p className="text-xs text-muted-foreground">{col.type}</p>
              </div>
            );
          })}

          <SheetFooter className="mt-6 flex gap-2">
            {!isNew && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isPending}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Delete
              </Button>
            )}
            <Button type="submit" disabled={isPending}>
              <Save className="mr-1 h-4 w-4" />
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
