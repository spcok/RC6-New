import { useLiveQuery } from '@tanstack/react-db';
import { safetyDrillsCollection } from '../../lib/database';
import { SafetyDrill } from '../../types';

export const useSafetyDrillData = () => {
  const { data: drills = [], isLoading } = useLiveQuery((q) => 
    q.from({ item: safetyDrillsCollection })
  );

  return {
    drills: drills.filter((d: SafetyDrill) => !d.isDeleted),
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
