import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { incidentsCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { Incident } from '../../types';
import { mapToCamelCase } from '../../lib/dataMapping';

export const useIncidentData = () => {
  const queryClient = useQueryClient();

  const { data: incidents = [], isLoading } = useQuery<Incident[]>({
    queryKey: ['incidents'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('incidents').select('*');
        if (error) throw error;
        
        const mappedData: Incident[] = data.map((item: Record<string, unknown>) => mapToCamelCase<Incident>(item));

        setTimeout(async () => {
          for (const item of mappedData) {
            try {
              const existingRecord = await incidentsCollection.findById(item.id);
              if (existingRecord) {
                await incidentsCollection.update(item);
              } else {
                await incidentsCollection.insert(item);
              }
            } catch (e) {
              console.warn(`[Vault Sync Warning] Failed to upsert record ${item.id}:`, e);
            }
          }
        }, 0);
        
        return mappedData;
      } catch {
        console.warn("Network unreachable. Serving incidents from local vault.");
        return await incidentsCollection.getAll();
      }
    }
  });

  const addIncidentMutation = useMutation({
    onMutate: async (incident: Omit<Incident, 'id' | 'createdAt'>) => {
      await queryClient.cancelQueries({ queryKey: ['incidents'] });
      const previousIncidents = queryClient.getQueryData<Incident[]>(['incidents']);
      const payload: Incident = {
        ...incident,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        isDeleted: false
      } as Incident;
      
      queryClient.setQueryData(['incidents'], [...(previousIncidents || []), payload]);
      await incidentsCollection.insert(payload);
      
      return { previousIncidents };
    },
    mutationFn: async (incident: Omit<Incident, 'id' | 'createdAt'>) => {
      const payload = { ...incident, id: crypto.randomUUID(), createdAt: new Date().toISOString(), isDeleted: false };
      const supabasePayload = {
        id: payload.id,
        animal_id: payload.animalId,
        incident_type: payload.incidentType,
        description: payload.description,
        severity: payload.severity,
        staff_initials: payload.staffInitials,
        created_at: payload.createdAt,
        is_deleted: payload.isDeleted
      };
      
      const { error } = await supabase.from('incidents').insert([supabasePayload]);
      if (error) throw error;
    },
    onError: (_err, _incident, context) => {
      queryClient.setQueryData(['incidents'], context?.previousIncidents);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['incidents'] })
  });

  const deleteIncidentMutation = useMutation({
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['incidents'] });
      const previousIncidents = queryClient.getQueryData<Incident[]>(['incidents']);
      
      queryClient.setQueryData(['incidents'], (old: Incident[] = []) => 
        old.map(i => i.id === id ? { ...i, isDeleted: true } : i)
      );
      await incidentsCollection.update(id, (prev) => ({ ...prev, isDeleted: true }) as Incident);
      
      return { previousIncidents };
    },
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('incidents').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(['incidents'], context?.previousIncidents);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['incidents'] })
  });

  return {
    incidents: incidents.filter(i => !i.isDeleted),
    isLoading,
    addIncident: addIncidentMutation.mutateAsync,
    deleteIncident: deleteIncidentMutation.mutateAsync,
    isMutating: addIncidentMutation.isPending || deleteIncidentMutation.isPending
  };
};
