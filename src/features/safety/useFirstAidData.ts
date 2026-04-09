import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLiveQuery } from '@tanstack/react-db';
import { firstAidCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';

export const useFirstAidData = () => {
  const queryClient = useQueryClient();

  const { data: firstAidLogs = [], isLoading } = useLiveQuery<any[]>({
    queryKey: ['first_aid_logs'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('first_aid_logs').select('*');
        if (error) throw error;
        return data;
      } catch (err) {
        return await firstAidCollection.getAll();
      }
    }
  });

  const addLogMutation = useMutation({
    mutationFn: async (log: any) => {
      const newLog = { ...log, id: log.id || crypto.randomUUID(), isDeleted: false };
      await firstAidCollection.insert(newLog);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['first_aid_logs'] })
  });

  const updateLogMutation = useMutation({
    mutationFn: async (log: any) => {
      await firstAidCollection.update(log.id, log);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['first_aid_logs'] })
  });

  return {
    firstAidLogs: firstAidLogs.filter(f => !f.isDeleted),
    isLoading,
    addLog: addLogMutation.mutateAsync,
    updateLog: updateLogMutation.mutateAsync,
  };
};
