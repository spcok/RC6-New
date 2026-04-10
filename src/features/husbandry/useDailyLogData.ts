import { useMemo } from 'react';
import { useLiveQuery } from '@tanstack/react-db';
import { getUKLocalDate } from '../../services/temporalService';
import { dailyLogsCollection, animalsCollection } from '../../lib/database';
import { LogEntry, LogType, AnimalCategory } from '../../types';

export const useDailyLogData = (_viewDate: string, activeCategory: AnimalCategory | 'all' | string, animalId?: string) => {
  
  // OFFICIAL SELECTOR: No manual queryFn needed here
  const { data: logs = [], isLoading: logsLoading } = useLiveQuery((q) => 
    q.from({ item: dailyLogsCollection })
  );

  const { data: animals = [], isLoading: animalsLoading } = useLiveQuery((q) => 
    q.from({ item: animalsCollection })
  );
  
  const dailyLogs = useMemo(() => {
    const targetDate = _viewDate === 'today' ? getUKLocalDate() : _viewDate;
    return logs.filter(log => 
      !log.isDeleted && 
      (_viewDate === 'all' || log.logDate === targetDate) && 
      (!animalId || log.animalId === animalId)
    );
  }, [logs, _viewDate, animalId]);

  const getTodayLog = (animalId: string, type: LogType) => {
    const targetDate = _viewDate === 'today' ? getUKLocalDate() : _viewDate;
    return logs.find(log => log.animalId === animalId && log.logType === type && log.logDate === targetDate);
  };

  const filteredAnimals = useMemo(() => {
    return animals.filter(a => activeCategory === 'all' || a.category === activeCategory);
  }, [animals, activeCategory]);

  return { 
    animals: filteredAnimals, 
    getTodayLog, 
    addLogEntry: (entry: Partial<LogEntry>) => dailyLogsCollection.insert({
        id: entry.id || crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        isDeleted: false,
        ...entry
    }), 
    updateLogEntry: (id: string, entry: Partial<LogEntry>) => dailyLogsCollection.update(id, entry),
    deleteLogEntry: (id: string) => dailyLogsCollection.delete(id),
    dailyLogs, 
    isLoading: animalsLoading || logsLoading
  };
};
