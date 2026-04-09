import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLiveQuery } from '@tanstack/react-db';
import { rotaCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';

export const useRotaData = () => {
  const queryClient = useQueryClient();

  const { data: shifts = [], isLoading } = useLiveQuery<any[]>({
    queryKey: ['staff_rota'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('staff_rota').select('*');
        if (error) throw error;
        return data;
      } catch (err) {
        return await rotaCollection.getAll();
      }
    }
  });

  const addShiftMutation = useMutation({
    mutationFn: async (shift: any) => {
      const newShift = { ...shift, id: shift.id || crypto.randomUUID(), isDeleted: false };
      await rotaCollection.insert(newShift);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['staff_rota'] })
  });

  const updateShiftMutation = useMutation({
    mutationFn: async (shift: any) => {
      await rotaCollection.update(shift.id, shift);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['staff_rota'] })
  });

  const deleteShiftMutation = useMutation({
    mutationFn: async (id: string) => {
      await rotaCollection.delete(id);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['staff_rota'] })
  });

  return {
    shifts: shifts.filter(s => !s.isDeleted),
    isLoading,
    addShift: addShiftMutation.mutateAsync,
    updateShift: updateShiftMutation.mutateAsync,
    deleteShift: deleteShiftMutation.mutateAsync,
  };
};
