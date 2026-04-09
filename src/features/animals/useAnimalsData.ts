import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLiveQuery } from '@tanstack/react-db';
import { animalsCollection } from '../../lib/database';
import { Animal } from '../../types';

export const useAnimalsData = () => {
  const queryClient = useQueryClient();

  // 1. FETCH DATA (Reactive UI via TanStack DB Vault)
  const { data: animals = [], isLoading } = useLiveQuery<Animal[]>({
    queryKey: ['animals'],
  });

  // 2. REMOTE MUTATIONS (Routed strictly through Offline Failover Vault)
  const addAnimalMutation = useMutation({
    mutationFn: async (animal: Omit<Animal, 'id'>) => {
      const newAnimal = { 
        ...animal, 
        id: crypto.randomUUID(), 
        isDeleted: false 
      } as Animal;
      await animalsCollection.insert(newAnimal);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['animals'] })
  });

  const updateAnimalMutation = useMutation({
    mutationFn: async (animal: Animal) => {
      await animalsCollection.update(animal.id, animal);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['animals'] })
  });

  const filteredAnimals = animals.filter(animal => !animal.isDeleted && !animal.archived);

  return { 
    animals: filteredAnimals, 
    isLoading,
    addAnimal: addAnimalMutation.mutateAsync,
    updateAnimal: updateAnimalMutation.mutateAsync
  };
};
