import { useQuery } from '@tanstack/react-query';
import { dailyLogsCollection } from '../../lib/database';
import { supabase } from '../../lib/supabase';
import { LogEntry, LogType } from '../../types';

const sanitizePayload = <T extends Record<string, unknown>>(payload: T): T => {
  const sanitized = { ...payload };
  Object.keys(sanitized).forEach(key => {
    if (key.startsWith('$')) delete sanitized[key];
  });
  return sanitized;
};

interface SupabaseLogEntry {
  id: string;
  animal_id: string | null;
  log_type: string | null;
  log_date: string | null;
  value: string | null;
  notes: string | null;
  user_initials: string | null;
  weight_grams: number | null;
  weight: number | null;
  weight_unit: string | null;
  health_record_type: string | null;
  basking_temp_c: number | null;
  cool_temp_c: number | null;
  temperature_c: number | null;
  created_at: string;
  created_by: string | null;
  integrity_seal: string | null;
  updated_at: string;
  is_deleted: boolean;
}

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
        
        for (const item of mappedData) {
          try {
            await dailyLogsCollection.update(sanitizePayload(item));
          } catch {
            await dailyLogsCollection.insert(sanitizePayload(item));
          }
        }
        
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
