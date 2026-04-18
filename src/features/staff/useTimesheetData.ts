import { useLiveQuery } from '@tanstack/react-db';
import { timesheetsCollection } from '../../lib/database';
import { Timesheet } from '../../types';

export const useTimesheetData = (staffName?: string) => {
  const { data, isLoading } = useLiveQuery((q) => 
    q.from({ item: timesheetsCollection })
  );

  const safeData = Array.isArray(data) ? data : [];
  
  const activeTimesheets = safeData.filter((t: Timesheet) => {
    if (!t || t.isDeleted) return false;
    if (staffName && t.staffName !== staffName) return false;
    return true;
  });

  return {
    // Aliases to prevent destructuring crashes
    timesheets: activeTimesheets,
    logs: activeTimesheets,
    data: activeTimesheets,
    
    isLoading,
    addTimesheet: async (entry: Partial<Timesheet>) => {
      await timesheetsCollection.insert({ ...entry, id: entry.id || crypto.randomUUID(), isDeleted: false } as Timesheet);
    },
    updateTimesheet: async (id: string, updates: Partial<Timesheet>) => {
      await timesheetsCollection.update(id, updates);
    },
    deleteTimesheet: async (id: string) => {
      await timesheetsCollection.delete(id);
    }
  };
};
