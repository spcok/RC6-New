import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLiveQuery } from '@tanstack/react-db';
import { animalsCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { Animal } from '../../types';

export const useAnimalsData = () => {
  const queryClient = useQueryClient();

  const { data: animals = [], isLoading } = useLiveQuery<Animal[]>({
    queryKey: ['animals'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('animals').select('*');
        if (error) throw error;
        return data as Animal[];
      } catch (err) {
        console.warn('Network unreachable: Failing over to local vault for animals');
        return await animalsCollection.getAll();
      }
    }
  });

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
