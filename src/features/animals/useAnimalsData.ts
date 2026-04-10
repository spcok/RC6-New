import { useLiveQuery } from '@tanstack/react-db';
import { animalsCollection } from '../../lib/database';
import { Animal } from '../../types';

export const useAnimalsData = () => {
  const { data: animals = [], isLoading } = useLiveQuery((q) => 
    q.from({ item: animalsCollection })
  );

  const filteredAnimals = animals.filter((animal: Animal) => !animal.isDeleted && !animal.archived);

  return { 
    animals: filteredAnimals, 
    isLoading,
    addAnimal: async (animal: Omit<Animal, 'id'>) => {
      await animalsCollection.insert({ ...animal, id: crypto.randomUUID(), isDeleted: false });
    },
    updateAnimal: async (animal: Animal) => {
      await animalsCollection.update(animal.id, animal);
    }
  };
};
