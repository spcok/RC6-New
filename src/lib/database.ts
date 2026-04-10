import { createCollection } from '@tanstack/react-db';
import { queryCollectionOptions } from '@tanstack/query-db-collection';
import { queryClient } from './queryClient';
import { supabase } from './supabase';
import { mapToCamelCase } from './dataMapping';
import { 
  Animal, LogEntry, Task, Timesheet, ClinicalNote, DailyRound,
  OrganizationSettings, ZlaDocument, DirectoryEntry, Movement,
  Transfer, RotaShift, Holiday, SafetyDrill, Incident,
  MaintenanceLog, FirstAidLog, UserProfile, MARChart, QuarantineRecord
} from '../types';

// --- 1. GLOBAL SNAKE CASE TRANSLATOR ---
const toSnakeCase = (str: string) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

const mapToSnakeCase = (obj: Record<string, unknown>): Record<string, unknown> => {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return obj as Record<string, unknown>;
  const newObj: Record<string, unknown> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      newObj[toSnakeCase(key)] = obj[key];
    }
  }
  return newObj;
};

interface CollectionOptions {
  hasSoftDelete?: boolean;
}

const createFailoverCollection = <T extends { id: string | number }>(
  tableName: string, 
  options: CollectionOptions = { hasSoftDelete: true }
) => {
  const collection = createCollection(
    queryCollectionOptions({
      queryClient,
      queryKey: [tableName],
      queryFn: async () => {
        if (!navigator.onLine) {
          throw new Error(`[Network] Offline. Preserving local vault for ${tableName}.`);
        }
        
        // FIX: The Auth Race Condition
        // Ensure Supabase has finished booting its token before we ask for data
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error(`[Auth] Session initializing. Preserving IndexedDB cache for ${tableName}.`);
        }
        
        let query = supabase.from(tableName).select('*');
        if (options.hasSoftDelete) {
          query = query.eq('is_deleted', false);
        }
          
        const { data, error } = await query;
        if (error) {
          console.error(`[Supabase Error] ${tableName}:`, error);
          throw error; 
        }
        
        return (data as Record<string, unknown>[]).map(item => mapToCamelCase<T>(item));
      },
      getKey: (item) => item.id,
      syncMode: 'eager',
      startSync: true,
      
      // --- 2. THE CHOKE POINT: TRANSLATING BEFORE QUEUEING ---
      onInsert: async ({ transaction }) => {
        const items = transaction.mutations.map(m => mapToSnakeCase(m.modified));
        
        queryClient.getMutationCache().build(queryClient, {
          mutationFn: async () => {
            const { error } = await supabase.from(tableName).insert(items);
            if (error) throw error;
          },
          networkMode: 'offlineFirst',
          retry: 3, 
        }).execute();
      },
      
      onUpdate: async ({ transaction }) => {
        queryClient.getMutationCache().build(queryClient, {
          mutationFn: async () => {
            for (const m of transaction.mutations) {
              const snakeCaseChanges = mapToSnakeCase(m.changes);
              const { error } = await supabase.from(tableName).update(snakeCaseChanges).eq('id', m.key);
              if (error) throw error;
            }
          },
          networkMode: 'offlineFirst',
        }).execute();
      },
      
      onDelete: async ({ transaction }) => {
        const keys = transaction.mutations.map(m => m.key);
        
        queryClient.getMutationCache().build(queryClient, {
          mutationFn: async () => {
            if (options.hasSoftDelete) {
              const { error } = await supabase.from(tableName).update({ is_deleted: true }).in('id', keys);
              if (error) throw error;
            } else {
              const { error } = await supabase.from(tableName).delete().in('id', keys);
              if (error) throw error;
            }
          },
          networkMode: 'offlineFirst',
        }).execute();
      }
    })
  ) as any;

  // --- 3. INSTANCE PATCH: SATISFY THE NATIVE HANDSHAKE ---
  // Route the offline observer directly to the TanStack Query cache in RAM
  collection.getOfflineData = async () => {
    return queryClient.getQueryData([tableName]) || [];
  };

  return collection;
};

// --- NATIVE COLLECTION EXPORTS ---
export const animalsCollection = createFailoverCollection<Animal>('animals');
export const dailyLogsCollection = createFailoverCollection<LogEntry>('daily_logs');
export const dailyRoundsCollection = createFailoverCollection<DailyRound>('daily_rounds');
export const tasksCollection = createFailoverCollection<Task>('tasks');
export const usersCollection = createFailoverCollection<UserProfile>('users');

export const orgSettingsCollection = createFailoverCollection<OrganizationSettings>('organisations', { hasSoftDelete: false });
export const zlaDocumentsCollection = createFailoverCollection<ZlaDocument>('zla_documents', { hasSoftDelete: false });
export const directoryCollection = createFailoverCollection<DirectoryEntry>('directory_contacts', { hasSoftDelete: false });
export const transfersCollection = createFailoverCollection<Transfer>('external_transfers', { hasSoftDelete: false });

export const medicalLogsCollection = createFailoverCollection<ClinicalNote>('medical_logs');
export const marChartsCollection = createFailoverCollection<MARChart>('mar_charts');
export const quarantineRecordsCollection = createFailoverCollection<QuarantineRecord>('quarantine_records');
export const movementsCollection = createFailoverCollection<Movement>('movements');
export const timesheetsCollection = createFailoverCollection<Timesheet>('timesheets');
export const rotaCollection = createFailoverCollection<RotaShift>('staff_rota');
export const holidaysCollection = createFailoverCollection<Holiday>('holidays');
export const safetyDrillsCollection = createFailoverCollection<SafetyDrill>('safety_drills');
export const incidentsCollection = createFailoverCollection<Incident>('incidents');
export const maintenanceCollection = createFailoverCollection<MaintenanceLog>('maintenance_logs');
export const firstAidCollection = createFailoverCollection<FirstAidLog>('first_aid_logs');
