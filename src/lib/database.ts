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

interface CollectionOptions {
  hasSoftDelete?: boolean;
}

const createFailoverCollection = <T extends { id: string | number }>(
  tableName: string, 
  options: CollectionOptions = { hasSoftDelete: true }
) => {
  return createCollection(
    queryCollectionOptions({
      queryClient,
      queryKey: [tableName],
      queryFn: async () => {
        if (!navigator.onLine) {
          throw new Error(`[Network] Offline. Preserving local vault for ${tableName}.`);
        }
        
        let query = supabase.from(tableName).select('*');
        
        // FIX: Only query 'is_deleted' if the table actually has that column
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
      getOfflineData: async () => { return []; },
      
      onInsert: async ({ transaction }) => {
        if (!navigator.onLine) {
          console.log(`[Vault] Offline. ${tableName} insert retained locally.`);
          return; // Prevents unhandled rejection; data stays in local IndexedDB
        }
        try {
          const items = transaction.mutations.map(m => m.modified);
          const { error } = await supabase.from(tableName).insert(items);
          if (error) throw error;
        } catch (err) {
          console.error(`[Sync Error] Failed to push insert to ${tableName}:`, err);
        }
      },
      onUpdate: async ({ transaction }) => {
        if (!navigator.onLine) {
          console.log(`[Vault] Offline. ${tableName} update retained locally.`);
          return;
        }
        try {
          for (const m of transaction.mutations) {
            const { error } = await supabase.from(tableName).update(m.changes).eq('id', m.key);
            if (error) throw error;
          }
        } catch (err) {
           console.error(`[Sync Error] Failed to push update to ${tableName}:`, err);
        }
      },
      onDelete: async ({ transaction }) => {
        if (!navigator.onLine) {
          console.log(`[Vault] Offline. ${tableName} delete retained locally.`);
          return;
        }
        try {
          const keys = transaction.mutations.map(m => m.key);
          // FIX: Use hard delete if the table lacks an 'is_deleted' column
          if (options.hasSoftDelete) {
            const { error } = await supabase.from(tableName).update({ is_deleted: true }).in('id', keys);
            if (error) throw error;
          } else {
            const { error } = await supabase.from(tableName).delete().in('id', keys);
            if (error) throw error;
          }
        } catch (err) {
          console.error(`[Sync Error] Failed to push delete to ${tableName}:`, err);
        }
      }
    })
  );
};

// --- NATIVE COLLECTION EXPORTS ---
export const animalsCollection = createFailoverCollection<Animal>('animals');
export const dailyLogsCollection = createFailoverCollection<LogEntry>('daily_logs');
export const dailyRoundsCollection = createFailoverCollection<DailyRound>('daily_rounds');
export const tasksCollection = createFailoverCollection<Task>('tasks');
export const usersCollection = createFailoverCollection<UserProfile>('users');

// FIX: Aligned explicitly to exact Supabase schema names and removed soft-delete expectation
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
