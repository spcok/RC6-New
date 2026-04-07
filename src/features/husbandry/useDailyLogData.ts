import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUKLocalDate } from '../../services/temporalService';
import { dailyLogsCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { LogEntry, LogType, AnimalCategory } from '../../types';
import { useAnimalsData } from '../animals/useAnimalsData';
import { mapToCamelCase } from '../../lib/dataMapping';

export const useDailyLogData = (_viewDate: string, activeCategory: AnimalCategory | 'all' | string, animalId?: string) => {
  const { animals, isLoading: animalsLoading } = useAnimalsData();
  const queryClient = useQueryClient();

  // 1. FETCH LOGS (Online-First)
  const { data: logs = [], isLoading: logsLoading } = useQuery<LogEntry[]>({
    queryKey: ['dailyLogs'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('daily_logs').select('*');
        if (error) throw error;

        if (!data) return [];

        const camelCaseData = mapToCamelCase<LogEntry>(data as Record<string, unknown>[]) as LogEntry[];

        const mappedData: LogEntry[] = camelCaseData.map((item: LogEntry): LogEntry => ({
          ...item,
          id: (item.id as string) ?? crypto.randomUUID(),
          animalId: item.animalId ?? "",
          logType: item.logType ?? LogType.GENERAL,
          logDate: item.logDate ?? new Date().toISOString(),
          value: item.value ?? "",
          isDeleted: item.isDeleted ?? false,
        }));
        
        // Refresh local vault
        for (const item of mappedData) {
          try {
            await dailyLogsCollection.update(item);
          } catch {
            await dailyLogsCollection.insert(item);
          }
        }
        
        return mappedData;
      } catch {
        console.warn("Network unreachable. Serving from local vault.");
        return await dailyLogsCollection.getAll();
      }
    }
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

  const addLogEntryMutation = useMutation({
    onMutate: async (entry: Partial<LogEntry>) => {
      const newEntry: LogEntry = {
        id: entry.id || crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        isDeleted: false,
        ...entry
      } as LogEntry;
      await dailyLogsCollection.insert(newEntry);
      return { newEntry };
    },
    mutationFn: async (entry: Partial<LogEntry>) => {
      const newEntry: LogEntry = {
        id: entry.id || crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        isDeleted: false,
        ...entry
      } as LogEntry;
      
      const supabasePayload = {
        id: newEntry.id,
        animalId: newEntry.animalId,
        logType: newEntry.logType,
        logDate: newEntry.logDate,
        value: newEntry.value,
        notes: newEntry.notes,
        userInitials: newEntry.userInitials,
        weightGrams: newEntry.weightGrams,
        weight: newEntry.weight,
        weightUnit: newEntry.weightUnit,
        healthRecordType: newEntry.healthRecordType,
        baskingTempC: newEntry.baskingTempC,
        coolTempC: newEntry.coolTempC,
        temperatureC: newEntry.temperatureC,
        createdAt: newEntry.createdAt || new Date().toISOString(),
        createdBy: newEntry.createdBy,
        integritySeal: newEntry.integritySeal,
        updatedAt: newEntry.updatedAt,
        isDeleted: newEntry.isDeleted
      };

      const { error } = await supabase.from('daily_logs').insert([supabasePayload]);
      if (error) throw error; 
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['dailyLogs'] })
  });

  const updateLogEntryMutation = useMutation({
    onMutate: async (entry: Partial<LogEntry>) => {
      if (!entry.id) return;
      const existing = logs.find(l => l.id === entry.id);
      if (existing) {
        await dailyLogsCollection.update({ ...existing, ...entry } as LogEntry & { id: string });
      }
      return { entry };
    },
    mutationFn: async (entry: Partial<LogEntry>) => {
      if (!entry.id) throw new Error("Cannot update without an ID");

      const supabasePayload = {
        animalId: entry.animalId,
        logType: entry.logType,
        logDate: entry.logDate,
        value: entry.value,
        notes: entry.notes,
        userInitials: entry.userInitials,
        weightGrams: entry.weightGrams,
        weight: entry.weight,
        weightUnit: entry.weightUnit,
        healthRecordType: entry.healthRecordType,
        baskingTempC: entry.baskingTempC,
        coolTempC: entry.coolTempC,
        temperatureC: entry.temperatureC,
        createdAt: entry.createdAt,
        createdBy: entry.createdBy,
        integritySeal: entry.integritySeal,
        updatedAt: new Date().toISOString(),
        isDeleted: entry.isDeleted
      };

      const { error } = await supabase.from('daily_logs').update(supabasePayload).eq('id', entry.id);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['dailyLogs'] })
  });

  const deleteLogEntryMutation = useMutation({
    onMutate: async (id: string) => {
      const existing = logs.find(l => l.id === id);
      if (existing) {
        await dailyLogsCollection.update({ ...existing, isDeleted: true } as LogEntry & { id: string });
      }
      return { id };
    },
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('daily_logs').update({ isDeleted: true }).eq('id', id);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['dailyLogs'] })
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
