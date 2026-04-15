import { useLiveQuery } from '@tanstack/react-db';
import { holidaysCollection } from '@/src/lib/db';
import { Holiday } from '../../types';

export const useHolidayData = () => {
  const { data, isLoading } = useLiveQuery((q) => 
    q.from({ item: holidaysCollection }).select((row) => row.item)
  );

  const safeData = Array.isArray(data) ? data : [];
  const activeHolidays = safeData.filter((h: Holiday) => h && !h.isDeleted);

  return {
    // Aliases
    holidays: activeHolidays,
    requests: activeHolidays,
    data: activeHolidays,

    isLoading,
    addHoliday: async (holiday: Partial<Holiday>) => {
      await holidaysCollection.insert({ ...holiday, id: holiday.id || crypto.randomUUID(), isDeleted: false } as Holiday);
    },
    updateHoliday: async (id: string, updates: Partial<Holiday>) => {
      await holidaysCollection.update(id, updates);
    },
    deleteHoliday: async (id: string) => {
      await holidaysCollection.delete(id);
    }
  };
};
