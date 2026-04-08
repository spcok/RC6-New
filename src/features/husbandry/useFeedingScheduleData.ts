import { useQuery } from '@tanstack/react-query';
import { dailyLogsCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { LogEntry, LogType } from '../../types';
import { mapToCamelCase } from '../../lib/dataMapping';

const sanitizePayload = <T extends Record<string, unknown>>(payload: T): T => {
  const sanitized = { ...payload };
  Object.keys(sanitized).forEach(key => {
    if (key.startsWith('$')) delete sanitized[key];
  });
  return sanitized;
};

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
        
        // Refresh local vault (Upsert Pattern)
        setTimeout(async () => {
          for (const item of mappedData) {
            try {
              const sanitizedItem = sanitizePayload(item);
              const existingRecord = await dailyLogsCollection.findById(sanitizedItem.id);
              if (existingRecord) {
                await dailyLogsCollection.update(sanitizedItem);
              } else {
                await dailyLogsCollection.insert(sanitizedItem);
              }
            } catch (e) {
              console.warn(`[Vault Sync Warning] Failed to upsert record ${item.id}:`, e);
            }
          }
        }, 0);
        
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
