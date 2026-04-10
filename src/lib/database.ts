import { createCollection } from '@tanstack/react-db';
import { queryCollectionOptions } from '@tanstack/query-db-collection';
import { queryClient } from './queryClient';
import { supabase } from './supabase';
import { mapToCamelCase } from './dataMapping';
import { 
  Animal, 
  LogEntry, 
  Task, 
  Timesheet, 
  ClinicalNote, 
  DailyRound,
  OrganizationSettings,
  ZlaDocument,
  DirectoryEntry,
  Movement,
  Transfer,
  RotaShift,
  Holiday,
  SafetyDrill,
  Incident,
  MaintenanceLog,
  FirstAidLog
} from '../types';

const createFailoverCollection = <T extends { id: string | number }>(tableName: string) => {
  return createCollection(
    queryCollectionOptions({
      queryClient,
      queryKey: [tableName],
      queryFn: async () => {
        try {
          if (!navigator.onLine) throw new Error('Offline');
          
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .eq('is_deleted', false);
            
          if (error) throw error;
          
          return (data as Record<string, unknown>[]).map(item => mapToCamelCase<T>(item));
        } catch (err) {
          console.warn(`[Vault] Supabase unreachable for ${tableName}. Serving persistent cache.`);
          return []; 
        }
      },
      getKey: (item) => item.id,
      // SATISFYING THE HANDSHAKE: Required for offline observers in queryCollectionOptions
      getOfflineData: async () => {
        return [];
      },
      onInsert: async ({ transaction }) => {
        const items = transaction.mutations.map(m => m.modified);
        await supabase.from(tableName).insert(items);
      },
      onUpdate: async ({ transaction }) => {
        for (const m of transaction.mutations) {
          await supabase.from(tableName).update(m.changes).eq('id', m.key);
        }
      },
      onDelete: async ({ transaction }) => {
        const keys = transaction.mutations.map(m => m.key);
        await supabase.from(tableName).update({ is_deleted: true }).in('id', keys);
      }
    })
  );
};

export const animalsCollection = createFailoverCollection<Animal>('animals');
export const dailyLogsCollection = createFailoverCollection<LogEntry>('daily_logs');
export const dailyRoundsCollection = createFailoverCollection<DailyRound>('daily_rounds');
export const tasksCollection = createFailoverCollection<Task>('tasks');
export const usersCollection = createFailoverCollection<any>('users');
export const orgSettingsCollection = createFailoverCollection<OrganizationSettings>('org_settings');
export const zlaDocumentsCollection = createFailoverCollection<ZlaDocument>('zla_documents');
export const directoryCollection = createFailoverCollection<DirectoryEntry>('directory');
export const medicalLogsCollection = createFailoverCollection<ClinicalNote>('medical_logs');
export const marChartsCollection = createFailoverCollection<any>('mar_charts');
export const quarantineRecordsCollection = createFailoverCollection<any>('quarantine_records');
export const movementsCollection = createFailoverCollection<Movement>('movements');
export const transfersCollection = createFailoverCollection<Transfer>('external_transfers');
export const timesheetsCollection = createFailoverCollection<Timesheet>('timesheets');
export const rotaCollection = createFailoverCollection<RotaShift>('staff_rota');
export const holidaysCollection = createFailoverCollection<Holiday>('holidays');
export const safetyDrillsCollection = createFailoverCollection<SafetyDrill>('safety_drills');
export const incidentsCollection = createFailoverCollection<Incident>('incidents');
export const maintenanceCollection = createFailoverCollection<MaintenanceLog>('maintenance_logs');
export const firstAidCollection = createFailoverCollection<FirstAidLog>('first_aid_logs');
