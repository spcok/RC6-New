import { useMemo } from 'react';
import { useLiveQuery } from '@tanstack/react-db';
import { getUKLocalDate } from '../../services/temporalService';
import { dailyLogsCollection, animalsCollection } from '../../lib/database';
import { LogEntry, LogType, AnimalCategory } from '../../types';

export const useDailyLogData = (viewDate: string, activeCategory: string, animalId?: string) => {
  const { data: logs = [], isLoading: logsLoading } = useLiveQuery((q) => q.from({ item: dailyLogsCollection }));
  const { data: animals = [], isLoading: animalsLoading } = useLiveQuery((q) => q.from({ item: animalsCollection }));
  
  const dailyLogs = useMemo(() => {
    let result = logs.filter((log: LogEntry) => !log.isDeleted);
    
    if (viewDate !== 'all') {
       const targetDate = viewDate === 'today' ? getUKLocalDate() : viewDate;
       result = result.filter((log: LogEntry) => log.logDate === targetDate);
    }
    
    // Strict Animal Filtering ensures Profile pages only show that specific animal
    if (animalId) {
       result = result.filter((log: LogEntry) => log.animalId === animalId);
    }
    
    return result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [logs, viewDate, animalId]);

  // THIS FIXES YOUR VITE CRASH
  const getTodayLog = (id: string, type: LogType) => {
    const targetDate = viewDate === 'today' || viewDate === 'all' ? getUKLocalDate() : viewDate;
    return logs.find((log: LogEntry) => log.animalId === id && log.logType === type && log.logDate === targetDate && !log.isDeleted);
  };

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
    getTodayLog, 
    addLogEntry: (entry: Partial<LogEntry>) => dailyLogsCollection.insert({
        id: entry.id || crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        isDeleted: false,
        ...entry
    }), 
    updateLogEntry: (id: string, entry: Partial<LogEntry>) => {
      return dailyLogsCollection.update(id, (old: LogEntry) => ({ 
          ...old, 
          ...entry, 
          id: old.id,
          updatedAt: new Date().toISOString()
      }));
    },
    deleteLogEntry: (id: string) => dailyLogsCollection.update(id, (old: LogEntry) => ({ ...old, isDeleted: true })),
    isLoading: animalsLoading || logsLoading
  };
};
