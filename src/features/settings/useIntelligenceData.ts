import { useLiveQuery } from '@tanstack/react-db';
import { animalsCollection } from '@/src/lib/db';

export const useIntelligenceData = () => {
  const { data: animals = [], isLoading } = useLiveQuery((q) => q.from({ item: animalsCollection }).select((row) => row.item));

  const runIUCNScan = async () => {
    if (!navigator.onLine) {
      console.log("IUCN Scan skipped: Network offline.");
      return null;
    }
    console.log("IUCN Scan Triggered");
    return true;
  };

  return {
    animals: animals.filter(a => !a.is_deleted),
    isLoading,
    runIUCNScan
  };
};
