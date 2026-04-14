import { useQuery } from '@tanstack/react-query';
import { dailyLogsCollection } from '@/src/lib/db';
import { supabase } from '../../lib/supabase';
import { LogEntry, LogType } from '../../types';
import { mapToCamelCase } from '../../lib/dataMapping';

export function useFeedingScheduleData(date: string) {
  const { data: logs = [], isLoading } = useQuery<LogEntry[]>({
    queryKey: ['dailyLogs'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('daily_logs').select('*');
        if (error) throw error;
        
        const camelCaseData = mapToCamelCase<LogEntry>(data as Record<string, unknown>[]) as LogEntry[];

        const mappedData: LogEntry[] = camelCaseData.map((item: LogEntry): LogEntry => ({
          ...item,
          id: item.id ?? crypto.randomUUID(),
          animalId: item.animalId ?? "",
          logType: item.logType ?? LogType.GENERAL,
          logDate: item.logDate ?? new Date().toISOString(),
          value: item.value ?? "",
          notes: item.notes ?? "",
          userInitials: item.userInitials ?? "",
          weightGrams: item.weightGrams ?? 0,
          weight: item.weight ?? 0,
          weightUnit: item.weightUnit ?? 'g',
          healthRecordType: item.healthRecordType ?? "",
          baskingTempC: item.baskingTempC ?? 0,
          coolTempC: item.coolTempC ?? 0,
          temperatureC: item.temperatureC ?? 0,
          createdAt: item.createdAt ?? new Date().toISOString(),
          createdBy: item.createdBy ?? "",
          integritySeal: item.integritySeal ?? "",
          updatedAt: item.updatedAt ?? new Date().toISOString(),
          isDeleted: item.isDeleted ?? false,
        }));
        
        return mappedData;
      } catch {
        console.warn("Network unreachable. Serving from local vault.");
        return await dailyLogsCollection.getAll();
      }
    }
  });

  const feedingLogs = logs.filter(l => l.logDate === date && l.logType === LogType.FEED);

  return {
    data: feedingLogs,
    isLoading
  };
}
