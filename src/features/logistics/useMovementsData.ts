import { useLiveQuery } from '@tanstack/react-db';
import { movementsCollection } from '../../lib/db';

export const useMovementsData = () => {
  const { data: movements = [], isLoading } = useLiveQuery((q) => q.from({ item: movementsCollection }));

  return { 
    movements: movements.filter((m: any) => !m.isDeleted), 
    isLoading, 
    addMovement: async (movement: any) => {
      await movementsCollection.insert({ ...movement, id: movement.id || crypto.randomUUID(), isDeleted: false });
    }
  };
};
