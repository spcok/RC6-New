import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rotaCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { Shift } from '../../types';
import { mapToCamelCase } from '../../lib/dataMapping';

export const useRotaData = () => {
  const queryClient = useQueryClient();

  const { data: shifts = [], isLoading } = useQuery<Shift[]>({
    queryKey: ['rota'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('rota').select('*');
        if (error) throw error;
        
        const mappedData: Shift[] = data.map((item: Record<string, unknown>) => mapToCamelCase<Shift>(item));

        setTimeout(async () => {
          for (const item of mappedData) {
            await rotaCollection.sync(item);
          }
        }, 0);
        
        return mappedData;
      } catch {
        console.warn("Network unreachable. Serving rota from local vault.");
        return await rotaCollection.getAll();
      }
    }
  });

  const addShiftMutation = useMutation({
    onMutate: async (shift: Partial<Shift>) => {
      await queryClient.cancelQueries({ queryKey: ['rota'] });
      const previousShifts = queryClient.getQueryData<Shift[]>(['rota']);
      const payload = {
        ...shift,
        id: shift.id || crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        isDeleted: false
      } as Shift;
      
      queryClient.setQueryData(['rota'], [...(previousShifts || []), payload]);
      await rotaCollection.sync(payload);
      
      return { previousShifts };
    },
    mutationFn: async (shift: Partial<Shift>) => {
      const payload = {
        ...shift,
        id: shift.id || crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        isDeleted: false
      };
      
      const supabasePayload = {
        id: payload.id,
        animal_id: payload.animalId,
        staff_id: payload.staffId,
        start_time: payload.startTime,
        end_time: payload.endTime,
        is_deleted: payload.isDeleted,
        created_at: payload.createdAt
      };
      
      const { error } = await supabase.from('rota').insert([supabasePayload]);
      if (error) throw error;
    },
    onError: (_err, _shift, context) => {
      queryClient.setQueryData(['rota'], context?.previousShifts);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['rota'] })
  });

  const updateShiftMutation = useMutation({
    onMutate: async (shift: Partial<Shift>) => {
      if (!shift.id) return;
      await queryClient.cancelQueries({ queryKey: ['rota'] });
      const previousShifts = queryClient.getQueryData<Shift[]>(['rota']);
      
      queryClient.setQueryData(['rota'], (old: Shift[] = []) => 
        old.map(s => s.id === shift.id ? { ...s, ...shift } : s)
      );
      await rotaCollection.update(shift.id, shift);
      
      return { previousShifts };
    },
    mutationFn: async (shift: Partial<Shift>) => {
      if (!shift.id) throw new Error("Cannot update without an ID");
      
      const supabasePayload = {
        animal_id: shift.animalId,
        staff_id: shift.staffId,
        start_time: shift.startTime,
        end_time: shift.endTime,
        is_deleted: shift.isDeleted
      };
      
      const { error } = await supabase.from('rota').update(supabasePayload).eq('id', shift.id);
      if (error) throw error;
    },
    onError: (_err, _shift, context) => {
      queryClient.setQueryData(['rota'], context?.previousShifts);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['rota'] })
  });

  const deleteShiftMutation = useMutation({
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['rota'] });
      const previousShifts = queryClient.getQueryData<Shift[]>(['rota']);
      
      queryClient.setQueryData(['rota'], (old: Shift[] = []) => 
        old.map(s => s.id === id ? { ...s, isDeleted: true } : s)
      );
      await rotaCollection.update(id, { isDeleted: true });
      
      return { previousShifts };
    },
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('rota').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(['rota'], context?.previousShifts);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['rota'] })
  });

  return { 
    shifts: shifts.filter(s => !s.isDeleted), 
    isLoading, 
    addShift: addShiftMutation.mutateAsync,
    updateShift: updateShiftMutation.mutateAsync,
    deleteShift: deleteShiftMutation.mutateAsync,
    isMutating: addShiftMutation.isPending || updateShiftMutation.isPending || deleteShiftMutation.isPending
  };
};
