import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { movementsCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { InternalMovement, MovementType } from '../../types';

export const useMovementsData = () => {
  const queryClient = useQueryClient();

  const { data: movements = [], isLoading } = useQuery<InternalMovement[]>({
    queryKey: ['movements'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('movements').select('*');
        if (error) throw error;
        
        const camelCaseData = mapToCamelCase<InternalMovement>(data as Record<string, unknown>[]) as InternalMovement[];

        const movements: InternalMovement[] = camelCaseData.map((item: InternalMovement): InternalMovement => ({
          ...item,
          id: item.id ?? crypto.randomUUID(),
          animalId: item.animalId ?? "",
          animalName: item.animalName ?? "Unknown",
          logDate: item.logDate ?? new Date().toISOString(),
          movementType: item.movementType ?? MovementType.TRANSFER,
          sourceLocation: item.sourceLocation ?? "",
          destinationLocation: item.destinationLocation ?? "",
          createdBy: item.createdBy ?? "Unknown",
          createdAt: item.createdAt ?? new Date().toISOString(),
          isDeleted: item.isDeleted ?? false
        }));
        
        for (const item of movements) {
          try {
            await movementsCollection.update(item);
          } catch {
            await movementsCollection.insert(item);
          }
        }
        return movements;
      } catch {
        console.warn("Network unreachable. Serving movements from local vault.");
        return await movementsCollection.getAll();
      }
    }
  });

  const addMovementMutation = useMutation({
    onMutate: async (movement: Partial<InternalMovement>) => {
      const payload: InternalMovement = {
        ...movement,
        id: movement.id || crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        isDeleted: false
      } as InternalMovement;
      await movementsCollection.insert(payload);
      return { payload };
    },
    mutationFn: async (movement: Partial<InternalMovement>) => {
      const payload = {
        ...movement,
        id: movement.id || crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        isDeleted: false
      } as InternalMovement;
      
      const supabasePayload = {
        id: payload.id,
        animal_id: payload.animalId,
        animal_name: payload.animalName,
        log_date: payload.logDate,
        movement_type: payload.movementType,
        source_location: payload.sourceLocation,
        destination_location: payload.destinationLocation,
        created_by: payload.createdBy,
        created_at: payload.createdAt,
        is_deleted: payload.isDeleted
      };

      const { error } = await supabase.from('movements').insert([supabasePayload]);
      if (error) throw error;
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
