import { useLiveQuery } from '@tanstack/react-db';
import { safetyDrillsCollection } from '@/src/lib/db';
import { SafetyDrill } from '../../types';

export const useSafetyDrillData = () => {
  const { data, isLoading } = useLiveQuery((q) => 
    q.from({ item: safetyDrillsCollection }).select((row) => row.item)
  );

  const safeData = Array.isArray(data) ? data : [];
  const activeDrills = safeData.filter((d: SafetyDrill) => d && !d.isDeleted);

  return {
    // Aliases
    drills: activeDrills,
    safetyDrills: activeDrills,
    logs: activeDrills,
    data: activeDrills,
    
    isLoading,
    addDrill: async (drill: Partial<SafetyDrill>) => {
      await safetyDrillsCollection.insert({ ...drill, id: drill.id || crypto.randomUUID(), isDeleted: false } as SafetyDrill);
    },
    updateDrill: async (id: string, updates: Partial<SafetyDrill>) => {
      await safetyDrillsCollection.update(id, updates);
    },
    deleteDrill: async (id: string) => {
      await safetyDrillsCollection.delete(id);
    }
  };
};
