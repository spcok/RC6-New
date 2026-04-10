import { useLiveQuery } from '@tanstack/react-db';
import { maintenanceCollection } from '../../lib/database';
import { MaintenanceLog } from '../../types';

export const useMaintenanceData = () => {
  const { data: maintenanceLogs = [], isLoading } = useLiveQuery((q) => 
    q.from({ item: maintenanceCollection })
  );

  return {
    maintenanceLogs: maintenanceLogs.filter((m: MaintenanceLog) => !m.isDeleted),
    isLoading,
    addMaintenanceLog: async (log: Partial<MaintenanceLog>) => {
      await maintenanceCollection.insert({ ...log, id: log.id || crypto.randomUUID(), isDeleted: false } as MaintenanceLog);
    },
    updateMaintenanceLog: async (id: string, updates: Partial<MaintenanceLog>) => {
      await maintenanceCollection.update(id, updates);
    },
    deleteMaintenanceLog: async (id: string) => {
      await maintenanceCollection.delete(id);
    }
  };
};
