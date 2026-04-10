import { useLiveQuery } from '@tanstack/react-db';
import { timesheetsCollection } from '../../lib/database';

export const useTimesheetData = (staffName?: string) => {
  // Official TanStack DB reactive selector
  const { data: timesheets = [], isLoading } = useLiveQuery((q) => 
    q.from({ item: timesheetsCollection })
  );

  const filteredTimesheets = staffName 
    ? timesheets.filter(t => !t.isDeleted && t.staffName === staffName)
    : timesheets.filter(t => !t.isDeleted);

  return {
    timesheets: filteredTimesheets,
    isLoading,
    addTimesheet: (entry: any) => timesheetsCollection.insert(entry),
    updateTimesheet: (id: string, entry: any) => timesheetsCollection.update(id, entry),
  };
};
