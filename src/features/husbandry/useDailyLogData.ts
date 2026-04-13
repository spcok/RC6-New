import { useMemo } from 'react';
import { useLiveQuery } from '@tanstack/react-db';
import { getUKLocalDate } from '../../services/temporalService';
import { dailyLogsCollection, animalsCollection } from '../../lib/database';
import { LogEntry, AnimalCategory } from '../../types';

export const useDailyLogData = (viewDate: string, activeCategory: string) => {
  const { data: logs = [], isLoading: logsLoading } = useLiveQuery((q) => q.from({ item: dailyLogsCollection }));
  const { data: animals = [], isLoading: animalsLoading } = useLiveQuery((q) => q.from({ item: animalsCollection }));
  
  const dailyLogs = useMemo(() => {
    let result = logs.filter((log: LogEntry) => !log.isDeleted);
    
    if (viewDate !== 'all') {
       const targetDate = viewDate === 'today' ? getUKLocalDate() : viewDate;
       result = result.filter((log: LogEntry) => log.logDate === targetDate);
    }
    
    return result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [logs, viewDate]);

  const filteredAnimals = useMemo(() => {
    return animals.filter((a: any) => {
      if (a.isDeleted || a.archived) return false;
      if (activeCategory === 'all') return true;
      return a.category === activeCategory;
    });
  }, [animals, activeCategory]);

  return {
    animals: filteredAnimals,
    dailyLogs,
    addLogEntry: async (entry: Partial<LogEntry>) => {
        await dailyLogsCollection.insert({
            id: entry.id || crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            isDeleted: false,
            ...entry
        });
    }, 
    // Safely added update function
    updateLogEntry: async (id: string, entry: Partial<LogEntry>) => {
      await dailyLogsCollection.update(id, (old: LogEntry) => ({ 
          ...old, 
          ...entry, 
          id: old.id,
          updatedAt: new Date().toISOString()
      }));
    },
    deleteLogEntry: async (id: string) => {
        await dailyLogsCollection.update(id, (old: LogEntry) => ({ ...old, isDeleted: true }));
    },
    isLoading: animalsLoading || logsLoading
  };
};
