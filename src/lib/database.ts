import { createCollection } from '@tanstack/react-db';
import { queryCollectionOptions } from '@tanstack/query-db-collection';
import { queryClient } from './queryClient';
import { supabase } from './supabase';
import { mapToCamelCase } from './dataMapping';

// Official helper for documented failover pattern
const createFailoverCollection = <T extends { id: string | number }>(tableName: string) => {
  return createCollection(
    queryCollectionOptions({
      queryClient,
      queryKey: [tableName],
      queryFn: async () => {
        try {
          if (!navigator.onLine) throw new Error('Offline');
          const { data, error } = await supabase.from(tableName).select('*').eq('is_deleted', false);
          if (error) throw error;
          return (data as Record<string, unknown>[]).map(item => mapToCamelCase<T>(item));
        } catch {
          // Returning [] triggers TanStack DB's native persistent storage lookup
          return []; 
        }
      },
      getKey: (item) => item.id,
      onInsert: async ({ transaction }) => {
        await supabase.from(tableName).insert(transaction.mutations.map(m => m.modified));
      },
      onUpdate: async ({ transaction }) => {
        for (const m of transaction.mutations) {
          await supabase.from(tableName).update(m.changes).eq('id', m.key);
        }
      },
      onDelete: async ({ transaction }) => {
        await supabase.from(tableName).update({ is_deleted: true }).in('id', transaction.mutations.map(m => m.key));
      }
    })
  );
};

// --- OFFICIAL NATIVE EXPORTS ---
export const animalsCollection = createFailoverCollection<any>('animals');
export const dailyLogsCollection = createFailoverCollection<any>('daily_logs');
export const tasksCollection = createFailoverCollection<any>('tasks');
export const usersCollection = createFailoverCollection<any>('users');
export const timesheetsCollection = createFailoverCollection<any>('timesheets');
export const dailyRoundsCollection = createFailoverCollection<any>('daily_rounds');
export const medicalLogsCollection = createFailoverCollection<any>('medical_logs');
export const marChartsCollection = createFailoverCollection<any>('mar_charts');
export const quarantineRecordsCollection = createFailoverCollection<any>('quarantine_records');
export const movementsCollection = createFailoverCollection<any>('movements');
export const transfersCollection = createFailoverCollection<any>('external_transfers');
export const rotaCollection = createFailoverCollection<any>('staff_rota');
export const holidaysCollection = createFailoverCollection<any>('holidays');
export const incidentsCollection = createFailoverCollection<any>('incidents');
export const maintenanceCollection = createFailoverCollection<any>('maintenance_logs');
export const firstAidCollection = createFailoverCollection<any>('first_aid_logs');
export const safetyDrillsCollection = createFailoverCollection<any>('safety_drills');
export const orgSettingsCollection = createFailoverCollection<any>('org_settings');
export const zlaDocumentsCollection = createFailoverCollection<any>('zla_documents');
export const directoryCollection = createFailoverCollection<any>('directory');
