import { useLiveQuery } from '@tanstack/react-db';
import { rotaCollection } from '@/src/lib/db';
import { RotaShift } from '../../types';

export const useRotaData = () => {
  const { data, isLoading } = useLiveQuery((q) => 
    q.from({ item: rotaCollection }).select((row) => row.item)
  );

  const safeData = Array.isArray(data) ? data : [];
  const activeShifts = safeData.filter((s: RotaShift) => s && !s.isDeleted);

  return {
    // Aliases
    shifts: activeShifts,
    rota: activeShifts,
    data: activeShifts,

    isLoading,
    addShift: async (shift: Partial<RotaShift>) => {
      await rotaCollection.insert({ ...shift, id: shift.id || crypto.randomUUID(), isDeleted: false } as RotaShift);
    },
    updateShift: async (id: string, updates: Partial<RotaShift>) => {
      await rotaCollection.update(id, updates);
    },
    deleteShift: async (id: string) => {
      await rotaCollection.delete(id);
    }
  };
};
