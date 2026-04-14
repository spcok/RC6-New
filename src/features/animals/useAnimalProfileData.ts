import { useQuery } from '@tanstack/react-query';
import { animalsCollection } from '@/src/lib/db';
import { Animal } from '../../types';

export function useAnimalProfileData(animalId: string | undefined) {
  const { data: animals = [], isLoading } = useQuery<Animal[]>({
    queryKey: ['animals'],
    queryFn: () => animalsCollection.getOfflineData(),
  });
  
  const animal = animals.find(a => a.id === animalId);

  return { animal, isLoading };
}
