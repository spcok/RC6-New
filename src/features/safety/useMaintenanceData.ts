import { useLiveQuery } from '@tanstack/react-db';
import { maintenanceCollection } from '@/src/lib/db';
import { MaintenanceLog } from '../../types';

export const useMaintenanceData = () => {
  const { data, isLoading } = useLiveQuery((q) => 
    q.from({ item: maintenanceCollection })
  );

  // 1. Safe Array Fallback: Protects against null/undefined cache states
  const safeData = Array.isArray(data) ? data : [];
  
  // 2. Safe Filter: Ensures we don't trip over undefined objects
  const activeLogs = safeData.filter((m: MaintenanceLog) => m && !m.isDeleted);

  return {
    // 3. Destructuring Aliases: Guarantees the component finds the array
    maintenanceLogs: activeLogs,
    maintenance: activeLogs,
    logs: activeLogs,
    data: activeLogs,
    
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
