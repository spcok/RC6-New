import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLiveQuery } from '@tanstack/react-db';
import { movementsCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { InternalMovement } from '../../types';

export const useMovementsData = () => {
  const queryClient = useQueryClient();

  const { data: movements = [], isLoading } = useLiveQuery<InternalMovement[]>({
    queryKey: ['movements'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('movements').select('*');
        if (error) throw error;
        return data as InternalMovement[];
      } catch (err) {
        return await movementsCollection.getAll();
      }
    }
  });

  const addMovementMutation = useMutation({
    mutationFn: async (movement: Partial<InternalMovement>) => {
      const payload: InternalMovement = {
        ...movement,
        id: movement.id || crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        isDeleted: false
      } as InternalMovement;
      
      await movementsCollection.insert(payload);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['movements'] })
  });

  return { 
    movements: movements.filter(m => !m.isDeleted), 
    isLoading, 
    addMovement: addMovementMutation.mutateAsync,
    isMutating: addMovementMutation.isPending
  };
};
