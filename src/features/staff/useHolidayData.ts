import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { holidaysCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { Holiday } from '../../types';

export function useHolidayData() {
  const queryClient = useQueryClient();

  const { data: holidays = [], isLoading } = useQuery<Holiday[]>({
    queryKey: ['holidays'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('holidays').select('*').eq('is_deleted', false);
        if (error) throw error;
        
        const mappedData = data as Holiday[];
        
        setTimeout(async () => {
          for (const item of mappedData) {
            await holidaysCollection.sync(item);
          }
        }, 0);
        
        return mappedData;
      } catch {
        console.warn("Network unreachable. Serving holidays from local vault.");
        return await holidaysCollection.getAll();
      }
    }
  });

  const addHolidayMutation = useMutation({
    mutationFn: async (holiday: Omit<Holiday, 'id'>) => {
      const payload = { ...holiday, id: crypto.randomUUID(), is_deleted: false } as Holiday;
      await holidaysCollection.sync(payload);
      
      const { error } = await supabase.from('holidays').insert([payload]);
      if (error) throw error;
      return payload;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['holidays'] })
  });

  const deleteHolidayMutation = useMutation({
    mutationFn: async (id: string) => {
      await holidaysCollection.update(id, { is_deleted: true } as any);
      const { error } = await supabase.from('holidays').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['holidays'] })
  });

  return {
    holidays: holidays.filter(h => !h.is_deleted),
    isLoading,
    addHoliday: addHolidayMutation.mutateAsync,
    deleteHoliday: deleteHolidayMutation.mutateAsync,
  };
}
