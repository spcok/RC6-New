import { useLiveQuery } from '@tanstack/react-db';
import { incidentsCollection } from '../../lib/database';
import { Incident } from '../../types';

export const useIncidentData = () => {
  const { data: incidents = [], isLoading } = useLiveQuery((q) => 
    q.from({ item: incidentsCollection })
  );

  return {
    incidents: incidents.filter((i: Incident) => !i.isDeleted),
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
