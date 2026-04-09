import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLiveQuery } from '@tanstack/react-db';
import { getUKLocalDate } from '../../services/temporalService';
import { dailyLogsCollection } from '../../lib/database';
import { LogEntry, LogType, AnimalCategory } from '../../types';
import { useAnimalsData } from '../animals/useAnimalsData';

export const useDailyLogData = (_viewDate: string, activeCategory: AnimalCategory | 'all' | string, animalId?: string) => {
  const { animals, isLoading: animalsLoading } = useAnimalsData();
  const queryClient = useQueryClient();

  // 1. FETCH LOGS (Reactive UI via TanStack DB Vault)
  // Replaced direct Supabase useQuery with useLiveQuery to watch IndexedDB instantly
  const { data: logs = [], isLoading: logsLoading } = useLiveQuery<LogEntry[]>({
    queryKey: ['daily_logs'],
  });
  
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

  // 2. REMOTE MUTATIONS (Routed strictly through Offline Failover Vault)
  // Stripped out all direct supabase.from() calls. The database.ts handlers now manage the cloud push and offline retry queue.
  const addLogEntryMutation = useMutation({
    mutationFn: async (entry: Partial<LogEntry>) => {
      const newEntry: LogEntry = {
        id: entry.id || crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        isDeleted: false,
        ...entry
      } as LogEntry;
      
      await dailyLogsCollection.insert(newEntry);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['daily_logs'] })
  });

  const updateLogEntryMutation = useMutation({
    mutationFn: async (entry: Partial<LogEntry>) => {
      if (!entry.id) throw new Error("Cannot update without an ID");
      await dailyLogsCollection.update(entry.id, entry);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['daily_logs'] })
  });

  const deleteLogEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      // Uses the collection.delete method to securely enforce the soft-delete pattern
      await dailyLogsCollection.delete(id);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['daily_logs'] })
  });

  const filteredAnimals = useMemo(() => {
    return animals.filter(a => activeCategory === 'all' || a.category === activeCategory);
  }, [animals, activeCategory]);

  return { 
    animals: filteredAnimals, 
    getTodayLog, 
    addLogEntry: addLogEntryMutation.mutateAsync, 
    updateLogEntry: updateLogEntryMutation.mutateAsync,
    deleteLogEntry: deleteLogEntryMutation.mutateAsync,
    dailyLogs, 
    isLoading: animalsLoading || logsLoading,
    isMutating: addLogEntryMutation.isPending || updateLogEntryMutation.isPending || deleteLogEntryMutation.isPending
  };
};