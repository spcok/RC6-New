import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLiveQuery } from '@tanstack/react-db';
import { holidaysCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';

export const useHolidayData = () => {
  const queryClient = useQueryClient();

  const { data: holidays = [], isLoading } = useLiveQuery<any[]>({
    queryKey: ['holidays'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('holidays').select('*');
        if (error) throw error;
        return data;
      } catch (err) {
        return await holidaysCollection.getAll();
      }
    }
  });

  const addHolidayMutation = useMutation({
    mutationFn: async (holiday: any) => {
      const newHoliday = { ...holiday, id: holiday.id || crypto.randomUUID(), isDeleted: false };
      await holidaysCollection.insert(newHoliday);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['holidays'] })
  });

  const updateHolidayMutation = useMutation({
    mutationFn: async (holiday: any) => {
      await holidaysCollection.update(holiday.id, holiday);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['holidays'] })
  });

  const deleteHolidayMutation = useMutation({
    mutationFn: async (id: string) => {
      await holidaysCollection.delete(id);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['holidays'] })
  });

  return {
    holidays: holidays.filter(h => !h.isDeleted),
    isLoading,
    addHoliday: addHolidayMutation.mutateAsync,
    updateHoliday: updateHolidayMutation.mutateAsync,
    deleteHoliday: deleteHolidayMutation.mutateAsync,
  };
};
