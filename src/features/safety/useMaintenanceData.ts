import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { MaintenanceLog } from '../../types';
import { mapToCamelCase } from '../../lib/dataMapping';

export const useMaintenanceData = () => {
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading } = useQuery<MaintenanceLog[]>({
    queryKey: ['maintenance'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('maintenance').select('*');
        if (error) throw error;
        
        const mappedData: MaintenanceLog[] = data.map((item: Record<string, unknown>) => mapToCamelCase<MaintenanceLog>(item));

        setTimeout(async () => {
          for (const item of mappedData) {
            try {
              await maintenanceCollection.update(item);
            } catch {
              await maintenanceCollection.insert(item);
            }
          }
        }, 0);
        
        return mappedData;
      } catch {
        console.warn("Network unreachable. Serving maintenance logs from local vault.");
        return await maintenanceCollection.getAll();
      }
    }
  });

  const addLogMutation = useMutation({
    onMutate: async (newTask: Omit<MaintenanceLog, 'id'>) => {
      await queryClient.cancelQueries({ queryKey: ['maintenance'] });
      const previousLogs = queryClient.getQueryData<MaintenanceLog[]>(['maintenance']);
      const payload: MaintenanceLog = { ...newTask, id: crypto.randomUUID() } as MaintenanceLog;
      
      queryClient.setQueryData(['maintenance'], [...(previousLogs || []), payload]);
      await maintenanceCollection.insert(payload);
      
      return { previousLogs };
    },
    mutationFn: async (newTask: Omit<MaintenanceLog, 'id'>) => {
      const payload = { ...newTask, id: crypto.randomUUID() };
      const supabasePayload = {
        id: payload.id,
        animal_id: payload.animalId,
        log_date: payload.logDate,
        log_type: payload.logType,
        log_details: payload.logDetails,
        staff_initials: payload.staffInitials,
        is_deleted: payload.isDeleted
      };
      
      const { error } = await supabase.from('maintenance').insert([supabasePayload]);
      if (error) throw error;
    },
    onError: (_err, _newTask, context) => {
      queryClient.setQueryData(['maintenance'], context?.previousLogs);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['maintenance'] })
  });

  const updateLogMutation = useMutation({
    onMutate: async (task: MaintenanceLog) => {
      await queryClient.cancelQueries({ queryKey: ['maintenance'] });
      const previousLogs = queryClient.getQueryData<MaintenanceLog[]>(['maintenance']);
      
      queryClient.setQueryData(['maintenance'], (old: MaintenanceLog[] = []) => 
        old.map(l => l.id === task.id ? { ...l, ...task } : l)
      );
      await maintenanceCollection.update(task.id, (prev) => ({ ...prev, ...task }));
      
      return { previousLogs };
    },
    mutationFn: async (task: MaintenanceLog) => {
      const supabasePayload = {
        animal_id: task.animalId,
        log_date: task.logDate,
        log_type: task.logType,
        log_details: task.logDetails,
        staff_initials: task.staffInitials,
        is_deleted: task.isDeleted
      };
      
      const { error } = await supabase.from('maintenance').update(supabasePayload).eq('id', task.id);
      if (error) throw error;
    },
    onError: (_err, _task, context) => {
      queryClient.setQueryData(['maintenance'], context?.previousLogs);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['maintenance'] })
  });

  const deleteLogMutation = useMutation({
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['maintenance'] });
      const previousLogs = queryClient.getQueryData<MaintenanceLog[]>(['maintenance']);
      
      queryClient.setQueryData(['maintenance'], (old: MaintenanceLog[] = []) => 
        old.map(l => l.id === id ? { ...l, isDeleted: true } : l)
      );
      await maintenanceCollection.update(id, (prev) => ({ ...prev, isDeleted: true }));
      
      return { previousLogs };
    },
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('maintenance').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(['maintenance'], context?.previousLogs);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['maintenance'] })
  });

  return {
    logs: logs.filter(l => !l.isDeleted),
    isLoading,
    addLog: addLogMutation.mutateAsync,
    updateLog: updateLogMutation.mutateAsync,
    deleteLog: deleteLogMutation.mutateAsync,
    isMutating: addLogMutation.isPending || updateLogMutation.isPending || deleteLogMutation.isPending
  };
};
