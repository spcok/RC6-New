import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLiveQuery } from '@tanstack/react-db';
import { maintenanceCollection } from '../../lib/database';

export const useMaintenanceData = () => {
  const queryClient = useQueryClient();

  const { data: maintenanceLogs = [], isLoading } = useLiveQuery<any[]>({
    queryKey: ['maintenance_logs'],
  });

  const addLogMutation = useMutation({
    mutationFn: async (log: any) => {
      const newLog = { ...log, id: log.id || crypto.randomUUID(), isDeleted: false };
      await maintenanceCollection.insert(newLog);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['maintenance_logs'] })
  });

  const updateLogMutation = useMutation({
    mutationFn: async (log: any) => {
      await maintenanceCollection.update(log.id, log);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['maintenance_logs'] })
  });

  const deleteLogMutation = useMutation({
    mutationFn: async (id: string) => {
      await maintenanceCollection.delete(id);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['maintenance_logs'] })
  });

  return {
    maintenanceLogs: maintenanceLogs.filter(m => !m.isDeleted),
    isLoading,
    addLog: addLogMutation.mutateAsync,
    updateLog: updateLogMutation.mutateAsync,
    deleteLog: deleteLogMutation.mutateAsync,
  };
};
