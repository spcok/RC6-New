import { useLiveQuery } from '@tanstack/react-db';
import { incidentsCollection } from '../../lib/db';
import { Incident } from '../../types';

export const useIncidentData = () => {
  const { data, isLoading } = useLiveQuery((q) => 
    q.from({ item: incidentsCollection })
  );

  const safeData = Array.isArray(data) ? data : [];
  const activeIncidents = safeData.filter((i: Incident) => i && !i.isDeleted);

  return {
    // Aliases
    incidents: activeIncidents,
    logs: activeIncidents,
    data: activeIncidents,
    
    isLoading,
    addIncident: async (incident: Partial<Incident>) => {
      await incidentsCollection.insert({ ...incident, id: incident.id || crypto.randomUUID(), isDeleted: false } as Incident);
    },
    updateIncident: async (id: string, updates: Partial<Incident>) => {
      await incidentsCollection.update(id, updates);
    },
    deleteIncident: async (id: string) => {
      await incidentsCollection.delete(id);
    }
  };
};
