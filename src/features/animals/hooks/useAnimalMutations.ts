import { useMutation, useQueryClient } from '@tanstack/react-query';
import { animalsCollection } from '../../../lib/database';
import { Animal } from '../../../types';

interface MovePayload {
  animalToMove: Animal;
  targetAnimal: Animal;
  direction: 'up' | 'down';
  allVisibleAnimals: Animal[];
}

export const useAnimalMutations = () => {
  const queryClient = useQueryClient();

  const moveAnimalMutation = useMutation({
    // 1. The actual database call (runs in the background)
    mutationFn: async ({ animalToMove, targetAnimal }: MovePayload) => {
      // Fetch the current state from the payload
      const orderA = animalToMove.customOrder ?? 0;
      const orderB = targetAnimal.customOrder ?? 0;

      if (orderA === orderB) {
        await animalsCollection.update(animalToMove.id, (old: Animal) => ({ ...old, customOrder: orderB - 5 }));
      } else {
        await animalsCollection.update(animalToMove.id, (old: Animal) => ({ ...old, customOrder: orderB }));
        await animalsCollection.update(targetAnimal.id, (old: Animal) => ({ ...old, customOrder: orderA }));
      }
    },

    // 2. OPTIMISTIC UPDATE: Fires instantly before the database call finishes
    onMutate: async ({ animalToMove, targetAnimal, allVisibleAnimals }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['animals'] });

      // Snapshot the previous value for rollbacks
      const previousAnimals = queryClient.getQueryData<Animal[]>(['animals']);

      // Calculate the new orders instantly in memory
      const indexA = allVisibleAnimals.findIndex(a => a.id === animalToMove.id);
      const indexB = allVisibleAnimals.findIndex(a => a.id === targetAnimal.id);
      
      const optimisticOrderA = targetAnimal.customOrder ?? (indexB * 10);
      const optimisticOrderB = animalToMove.customOrder ?? (indexA * 10);

      // Optimistically update the cache
      queryClient.setQueryData<Animal[]>(['animals'], (old) => {
        if (!old) return old;
        return old.map(animal => {
          if (animal.id === animalToMove.id) return { ...animal, customOrder: optimisticOrderA };
          if (animal.id === targetAnimal.id) return { ...animal, customOrder: optimisticOrderB };
          return animal;
        });
      });

      // Return context for rollback
      return { previousAnimals };
    },

    // 3. ROLLBACK: If the offline DB fails, snap the UI back to normal
    onError: (err, _newTodo, context) => {
      if (context?.previousAnimals) {
        queryClient.setQueryData(['animals'], context.previousAnimals);
      }
      console.error("Mutation failed, rolled back UI:", err);
    },

    // 4. SYNC: Always refetch after error or success to ensure 100% truth
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
    },
  });

  return {
    moveAnimal: moveAnimalMutation.mutate,
    isMoving: moveAnimalMutation.isPending
  };
};
