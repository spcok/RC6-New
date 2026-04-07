import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { MaintenanceLog } from '../../types';

export const useMaintenanceData = () => {
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading } = useQuery<MaintenanceLog[]>({
    queryKey: ['maintenance'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('maintenance').select('*');
        if (error) throw error;
        data.forEach(item => maintenanceCollection.update(item.id, () => item as MaintenanceLog).catch(() => maintenanceCollection.insert(item as MaintenanceLog)));
        return data as MaintenanceLog[];
      } catch {
        console.warn("Network unreachable. Serving maintenance logs from local vault.");
        return await maintenanceCollection.getAll();
      }
    }
  });

  const addLogMutation = useMutation({
    onMutate: async (newTask: Omit<MaintenanceLog, 'id'>) => {
      const payload: MaintenanceLog = { ...newTask, id: crypto.randomUUID() } as MaintenanceLog;
      await maintenanceCollection.insert(payload);
      return { payload };
    },
    mutationFn: async (newTask: Omit<MaintenanceLog, 'id'>) => {
      const payload = { ...newTask, id: crypto.randomUUID() };
      const { error } = await supabase.from('maintenance').insert([payload]);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['maintenance'] })
  });

  const updateLogMutation = useMutation({
    onMutate: async (task: MaintenanceLog) => {
      await maintenanceCollection.update(task.id, (prev) => ({ ...prev, ...task }));
      return { task };
    },
    mutationFn: async (task: MaintenanceLog) => {
      const { error } = await supabase.from('maintenance').update(task).eq('id', task.id);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['maintenance'] })
  });

  const deleteLogMutation = useMutation({
    onMutate: async (id: string) => {
      await maintenanceCollection.update(id, (prev) => ({ ...prev, is_deleted: true }));
      return { id };
    },
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('maintenance').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['maintenance'] })
  });

  return {
    logs: logs.filter(l => !l.is_deleted),
    isLoading,
    addLog: addLogMutation.mutateAsync,
    updateLog: updateLogMutation.mutateAsync,
    deleteLog: deleteLogMutation.mutateAsync,
    isMutating: addLogMutation.isPending || updateLogMutation.isPending || deleteLogMutation.isPending
  };
};
