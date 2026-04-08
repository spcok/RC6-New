import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { firstAidCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { FirstAidLog } from '../../types';
import { mapToCamelCase } from '../../lib/dataMapping';

export function useFirstAidData() {
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading } = useQuery<FirstAidLog[]>({
    queryKey: ['firstAid'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('first_aid').select('*');
        if (error) throw error;
        
        const mappedData: FirstAidLog[] = data.map((item: Record<string, unknown>) => mapToCamelCase<FirstAidLog>(item));
        
        setTimeout(async () => {
          for (const item of mappedData) {
            try {
              const existingRecord = await firstAidCollection.findById(item.id);
              if (existingRecord) {
                await firstAidCollection.update(item);
              } else {
                await firstAidCollection.insert(item);
              }
            } catch (e) {
              console.warn(`[Vault Sync Warning] Failed to upsert record ${item.id}:`, e);
            }
          }
        }, 0);
        return mappedData;
      } catch {
        console.warn("Network unreachable. Serving First Aid logs from local vault.");
        return await firstAidCollection.getAll();
      }
    }
  });

  const addFirstAidMutation = useMutation({
    onMutate: async (log: Omit<FirstAidLog, 'id' | 'created_at'>) => {
      const payload: FirstAidLog = {
        ...log,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString()
      } as FirstAidLog;
      await firstAidCollection.insert(payload);
      return { payload };
    },
    mutationFn: async (log: Omit<FirstAidLog, 'id' | 'created_at'>) => {
      const payload = { ...log, id: crypto.randomUUID(), created_at: new Date().toISOString() };
      const supabasePayload = {
        id: payload.id,
        animal_id: payload.animalId,
        log_date: payload.logDate,
        incident_type: payload.incidentType,
        treatment_given: payload.treatmentGiven,
        staff_initials: payload.staffInitials,
        created_at: payload.created_at,
        is_deleted: payload.isDeleted ?? false
      };
      const { error } = await supabase.from('first_aid').insert([supabasePayload]);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['firstAid'] })
  });

  const deleteFirstAidMutation = useMutation({
    onMutate: async (id: string) => {
      await firstAidCollection.update(id, (prev) => ({ ...prev, is_deleted: true }));
      return { id };
    },
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('first_aid').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['firstAid'] })
  });

  return {
    logs: logs.filter(l => !l.is_deleted),
    isLoading,
    addFirstAid: addFirstAidMutation.mutateAsync,
    deleteFirstAid: deleteFirstAidMutation.mutateAsync,
    isMutating: addFirstAidMutation.isPending || deleteFirstAidMutation.isPending
  };
}
