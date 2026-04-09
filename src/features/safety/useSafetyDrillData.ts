import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLiveQuery } from '@tanstack/react-db';
import { safetyDrillsCollection } from '../../lib/database';

export const useSafetyDrillData = () => {
  const queryClient = useQueryClient();

  const { data: drills = [], isLoading } = useLiveQuery<any[]>({
    queryKey: ['safety_drills'],
  });

  const addDrillMutation = useMutation({
    mutationFn: async (drill: any) => {
      const newDrill = { ...drill, id: drill.id || crypto.randomUUID(), isDeleted: false };
      await safetyDrillsCollection.insert(newDrill);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['safety_drills'] })
  });

  const updateDrillMutation = useMutation({
    mutationFn: async (drill: any) => {
      await safetyDrillsCollection.update(drill.id, drill);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['safety_drills'] })
  });

  return {
    drills: drills.filter(d => !d.isDeleted),
    isLoading,
    addDrill: addDrillMutation.mutateAsync,
    updateDrill: updateDrillMutation.mutateAsync,
  };
};
