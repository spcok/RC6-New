import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timesheetsCollection } from '../../lib/database';

export const useTimesheetData = (staffName?: string) => {
  const queryClient = useQueryClient();

  // FIX: Swapped useLiveQuery for stable useQuery hitting the local failover vault
  const { data: timesheets = [], isLoading } = useQuery<any[]>({
    queryKey: ['timesheets'],
    queryFn: async () => await timesheetsCollection.getAll()
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
