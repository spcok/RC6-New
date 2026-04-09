import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLiveQuery } from '@tanstack/react-db';
import { incidentsCollection } from '../../lib/database';

export const useIncidentData = () => {
  const queryClient = useQueryClient();

  const { data: incidents = [], isLoading } = useLiveQuery<any[]>({
    queryKey: ['incidents'],
  });

  const addIncidentMutation = useMutation({
    mutationFn: async (incident: any) => {
      const newIncident = { ...incident, id: incident.id || crypto.randomUUID(), isDeleted: false };
      await incidentsCollection.insert(newIncident);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['incidents'] })
  });

  const updateIncidentMutation = useMutation({
    mutationFn: async (incident: any) => {
      await incidentsCollection.update(incident.id, incident);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['incidents'] })
  });

  return {
    incidents: incidents.filter(i => !i.isDeleted),
    isLoading,
    addIncident: addIncidentMutation.mutateAsync,
    updateIncident: updateIncidentMutation.mutateAsync,
  };
};
