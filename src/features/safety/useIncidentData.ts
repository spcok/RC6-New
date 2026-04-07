import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { incidentsCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { Incident } from '../../types';

export const useIncidentData = () => {
  const queryClient = useQueryClient();

  const { data: incidents = [], isLoading } = useQuery<Incident[]>({
    queryKey: ['incidents'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('incidents').select('*');
        if (error) throw error;
        data.forEach(item => incidentsCollection.update(item.id, () => item as Incident).catch(() => incidentsCollection.insert(item as Incident)));
        return data as Incident[];
      } catch {
        console.warn("Network unreachable. Serving incidents from local vault.");
        return await incidentsCollection.getAll();
      }
    }
  });

  const addIncidentMutation = useMutation({
    onMutate: async (incident: Omit<Incident, 'id' | 'created_at'>) => {
      const payload: Incident = {
        ...incident,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString()
      } as Incident;
      await incidentsCollection.insert(payload);
      return { payload };
    },
    mutationFn: async (incident: Omit<Incident, 'id' | 'created_at'>) => {
      const payload = { ...incident, id: crypto.randomUUID(), created_at: new Date().toISOString() };
      const { error } = await supabase.from('incidents').insert([payload]);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['incidents'] })
  });

  const deleteIncidentMutation = useMutation({
    onMutate: async (id: string) => {
      await incidentsCollection.update(id, (prev) => ({ ...prev, is_deleted: true }));
      return { id };
    },
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('incidents').update({ is_deleted: true }).eq('id', id);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['incidents'] })
  });

  return {
    incidents,
    isLoading,
    addIncident: addIncidentMutation.mutateAsync,
    deleteIncident: deleteIncidentMutation.mutateAsync,
    isMutating: addIncidentMutation.isPending || deleteIncidentMutation.isPending
  };
};
