import { useResource } from '@lib/swr';
import { PrintJob } from '@validations/print-job';
import { printJobSchema } from '@validations/print-job';
import { useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function usePrintJobs() {
  const {
    data: printJobs,
    error,
    isLoading,
    create,
    update,
    refresh,
  } = useResource<PrintJob>('/print-jobs', {
    onError: (error) => {
      console.error('Print jobs operation failed:', error);
      toast.error('Failed to load print jobs');
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('print-jobs-ui')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'print_jobs' },
        () => {
          refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  const handleUpdate = useCallback(async (id: string, data: Partial<PrintJob>) => {
    if (!id) {
      throw new Error('Print job ID is required for update');
    }

    try {
      const validatedData = printJobSchema.partial().parse(data);
      const result = await update(id, validatedData);
      await refresh();
      toast.success('Print job updated successfully');
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update print job');
      toast.error('Failed to update print job');
      throw error;
    }
  }, [update, refresh]);

  const handleCreate = useCallback(async (data: PrintJob) => {
    try {
      const validatedData = printJobSchema.parse(data);
      const result = await create(validatedData);
      await refresh();
      toast.success('Print job created successfully');
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create print job');
      toast.error('Failed to create print job');
      throw error;
    }
  }, [create, refresh]);

  return {
    printJobs: Array.isArray(printJobs) ? printJobs : (printJobs ? [printJobs] : []),
    isLoading,
    error,
    updatePrintJob: handleUpdate,
    createPrintJob: handleCreate,
    refresh,
  };
} 