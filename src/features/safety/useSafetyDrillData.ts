import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { safetyDrillsCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { SafetyDrill } from '../../types';

export const useSafetyDrillData = () => {
  const queryClient = useQueryClient();

  const { data: drills = [], isLoading } = useQuery<SafetyDrill[]>({
    queryKey: ['safetyDrills'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('safety_drills').select('*');
        if (error) throw error;
        return data as SafetyDrill[];
      } catch {
        console.warn("Network unreachable. Serving safety drills from local vault.");
        return await safetyDrillsCollection.getAll();
      }
    }
  });

  const addDrillLogMutation = useMutation({
    onMutate: async (newDrill: Omit<SafetyDrill, 'id'>) => {
      const payload: SafetyDrill = { ...newDrill, id: crypto.randomUUID() } as SafetyDrill;
      await safetyDrillsCollection.sync(payload);
      return { payload };
    },
    mutationFn: async (newDrill: Omit<SafetyDrill, 'id'>) => {
      const payload = { ...newDrill, id: crypto.randomUUID() };
      const { error } = await supabase.from('safety_drills').insert([payload]);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['safetyDrills'] })
  });

  const deleteDrillLogMutation = useMutation({
    onMutate: async (id: string) => {
      await safetyDrillsCollection.update(id, { is_deleted: true } as any);
      return { id };
    },
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('safety_drills').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['safetyDrills'] })
  });

  return {
    drills: drills.filter(d => !d.is_deleted),
    isLoading,
    addDrillLog: addDrillLogMutation.mutateAsync,
    deleteDrillLog: deleteDrillLogMutation.mutateAsync,
    isMutating: addDrillLogMutation.isPending || deleteDrillLogMutation.isPending
  };
};
