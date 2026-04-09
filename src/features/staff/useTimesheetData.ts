import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLiveQuery } from '@tanstack/react-db';
import { timesheetsCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';

export const useTimesheetData = (staffName?: string) => {
  const queryClient = useQueryClient();

  const { data: timesheets = [], isLoading } = useLiveQuery<any[]>({
    queryKey: ['timesheets'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('timesheets').select('*');
        if (error) throw error;
        return data;
      } catch (err) {
        return await timesheetsCollection.getAll();
      }
    }
  });

  const filteredTimesheets = timesheets.filter(t => !t.isDeleted && (!staffName || t.staffName === staffName));

  const addTimesheetMutation = useMutation({
    mutationFn: async (entry: any) => {
      const newEntry = { ...entry, id: entry.id || crypto.randomUUID(), isDeleted: false };
      await timesheetsCollection.insert(newEntry);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['timesheets'] })
  });

  const updateTimesheetMutation = useMutation({
    mutationFn: async (entry: any) => {
      await timesheetsCollection.update(entry.id, entry);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['timesheets'] })
  });

  return {
    timesheets: filteredTimesheets,
    isLoading,
    addTimesheet: addTimesheetMutation.mutateAsync,
    updateTimesheet: updateTimesheetMutation.mutateAsync,
  };
};
