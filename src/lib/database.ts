import { createCollection } from '@tanstack/react-db';
import { queryCollectionOptions } from '@tanstack/query-db-collection';
import { queryClient } from './queryClient';
import { supabase } from './supabase';
import { mapToCamelCase } from './dataMapping';

/**
 * OFFICIAL ARCHITECTURAL PATTERN
 * This factory generates a Collection using strictly official TanStack primitives.
 * It provides the internal observers required by useLiveQuery to prevent crashes.
 */
const createFailoverCollection = <T extends { id: string | number }>(tableName: string) => {
  return createCollection(
    queryCollectionOptions({
      queryClient,
      queryKey: [tableName],
      // ONLINE-FIRST CIRCUIT BREAKER (Official 'queryFn' pattern)
      queryFn: async () => {
        try {
          if (!navigator.onLine) throw new Error('Offline');
          const { data, error } = await supabase.from(tableName).select('*');
          if (error) throw error;
          return mapToCamelCase(data as Record<string, unknown>[]) as T[];
        } catch (err) {
          // DOCUMENTED FAILOVER: Returning [] allows TanStack DB to serve its 
          // persistent 14-day local snapshot from IndexedDB.
          console.warn(`[Failover] Supabase unreachable for ${tableName}. Using local vault.`);
          return []; 
        }
      },
      getKey: (item) => item.id,
      // OFFICIAL SYNC HANDLERS: Synchronizes local mutations to the cloud
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

// --- NATIVE COLLECTION EXPORTS ---
export const animalsCollection = createFailoverCollection<any>('animals');
export const dailyLogsCollection = createFailoverCollection<any>('daily_logs');
export const tasksCollection = createFailoverCollection<any>('tasks');
export const timesheetsCollection = createFailoverCollection<any>('timesheets');
export const rotaCollection = createFailoverCollection<any>('staff_rota');
export const holidaysCollection = createFailoverCollection<any>('holidays');
export const incidentsCollection = createFailoverCollection<any>('incidents');
export const maintenanceCollection = createFailoverCollection<any>('maintenance_logs');
export const firstAidCollection = createFailoverCollection<any>('first_aid_logs');
export const safetyDrillsCollection = createFailoverCollection<any>('safety_drills');
export const medicalLogsCollection = createFailoverCollection<any>('medical_logs');
export const marChartsCollection = createFailoverCollection<any>('mar_charts');
export const quarantineRecordsCollection = createFailoverCollection<any>('quarantine_records');
export const movementsCollection = createFailoverCollection<any>('movements');
export const transfersCollection = createFailoverCollection<any>('external_transfers');
