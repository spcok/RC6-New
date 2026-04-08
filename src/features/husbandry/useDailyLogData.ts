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
      
      await dailyLogsCollection.sync(newEntry);
      return { newEntry };
    },
    mutationFn: async (entry: Partial<LogEntry>) => {
      const newEntry: LogEntry = {
        id: entry.id || crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        isDeleted: false,
        ...entry
      } as LogEntry;
      
      // CRITICAL FIX: Map camelCase app state to snake_case database columns
      const supabasePayload = {
        id: newEntry.id,
        animal_id: newEntry.animalId,
        log_type: newEntry.logType,
        log_date: newEntry.logDate,
        value: newEntry.value,
        notes: newEntry.notes,
        user_initials: newEntry.userInitials,
        weight_grams: newEntry.weightGrams,
        weight: newEntry.weight,
        weight_unit: newEntry.weightUnit,
        health_record_type: newEntry.healthRecordType,
        basking_temp_c: newEntry.baskingTempC,
        cool_temp_c: newEntry.coolTempC,
        temperature_c: newEntry.temperatureC,
        created_at: newEntry.createdAt || new Date().toISOString(),
        created_by: newEntry.createdBy,
        integrity_seal: newEntry.integritySeal,
        updated_at: newEntry.updatedAt,
        is_deleted: newEntry.isDeleted
      };

      const { error } = await supabase.from('daily_logs').insert([supabasePayload]);
      if (error) throw error; 
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['dailyLogs'] })
  });

  const updateLogEntryMutation = useMutation({
    onMutate: async (entry: Partial<LogEntry>) => {
      if (!entry.id) return;
      
      const existing = await dailyLogsCollection.findById(entry.id);
      await dailyLogsCollection.sync({ ...existing, ...entry } as LogEntry);
      return { entry };
    },
    mutationFn: async (entry: Partial<LogEntry>) => {
      if (!entry.id) throw new Error("Cannot update without an ID");

      // CRITICAL FIX: Map camelCase app state to snake_case database columns
      const supabasePayload = {
        animal_id: entry.animalId,
        log_type: entry.logType,
        log_date: entry.logDate,
        value: entry.value,
        notes: entry.notes,
        user_initials: entry.userInitials,
        weight_grams: entry.weightGrams,
        weight: entry.weight,
        weight_unit: entry.weightUnit,
        health_record_type: entry.healthRecordType,
        basking_temp_c: entry.baskingTempC,
        cool_temp_c: entry.coolTempC,
        temperature_c: entry.temperatureC,
        created_at: entry.createdAt,
        created_by: entry.createdBy,
        integrity_seal: entry.integritySeal,
        updated_at: new Date().toISOString(),
        is_deleted: entry.isDeleted
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
        await dailyLogsCollection.update(id, { isDeleted: true });
      }
      return { id };
    },
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('daily_logs').update({ is_deleted: true }).eq('id', id);
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
