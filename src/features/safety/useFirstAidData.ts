import { useLiveQuery } from '@tanstack/react-db';
import { firstAidCollection } from '../../lib/database';
import { FirstAidLog } from '../../types';

export const useFirstAidData = () => {
  const { data, isLoading } = useLiveQuery((q) => 
    q.from({ item: firstAidCollection })
  );

  const safeData = Array.isArray(data) ? data : [];
  const activeLogs = safeData.filter((f: FirstAidLog) => f && !f.isDeleted);

  return {
    // Aliases to prevent destructuring crashes
    firstAidLogs: activeLogs,
    firstAid: activeLogs,
    logs: activeLogs,
    data: activeLogs,
    
    isLoading,
    addFirstAidLog: async (log: Partial<FirstAidLog>) => {
      await firstAidCollection.insert({ ...log, id: log.id || crypto.randomUUID(), isDeleted: false } as FirstAidLog);
    },
    updateFirstAidLog: async (id: string, updates: Partial<FirstAidLog>) => {
      await firstAidCollection.update(id, updates);
    },
    deleteFirstAidLog: async (id: string) => {
      await firstAidCollection.delete(id);
    }
  };
};
