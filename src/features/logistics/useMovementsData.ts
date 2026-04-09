import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLiveQuery } from '@tanstack/react-db';
import { movementsCollection } from '../../lib/database';
import { InternalMovement } from '../../types';

export const useMovementsData = () => {
  const queryClient = useQueryClient();

  // 1. FETCH DATA (Reactive UI via TanStack DB Vault)
  const { data: movements = [], isLoading } = useLiveQuery<InternalMovement[]>({
    queryKey: ['movements'],
  });

  // 2. REMOTE MUTATIONS (Routed strictly through Offline Failover Vault)
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
