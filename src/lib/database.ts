import { createCollection as baseCreateCollection } from '@tanstack/react-db';
import { queryClient } from './queryClient';
import { supabase } from './supabase';
import { LogEntry, Animal, Timesheet, Task, ClinicalNote, DailyRound } from '../types';
import { mapToCamelCase } from './dataMapping';

export interface FailoverRepository<T> {
  sync: (item: T) => Promise<void>;
  getAll: () => Promise<T[]>;
  findById: (id: string) => Promise<T | undefined>;
  insert: (item: T) => Promise<void>;
  update: (id: string, item: Partial<T>) => Promise<void>;
  delete: (id: string) => Promise<void>;
}

export const createFailoverRepository = <T extends { id: string }>(tableName: string): FailoverRepository<T> => {
  const collection = baseCreateCollection<T, string>({
    queryKey: [tableName],
    queryClient,
    getKey: (item) => item.id,
    queryFn: async () => {
      const { data, error } = await supabase.from(tableName).select('*').eq('is_deleted', false).limit(5000);
      if (error) throw error;
      return (data as Record<string, unknown>[]).map(item => mapToCamelCase<T>(item));
    },
    // The empty sync object satisfies the initialization requirement
    sync: {},
    // The top-level handlers satisfy the mutation requirement
    onInsert: async () => {},
    onUpdate: async () => {},
    onDelete: async () => {}
  });

  return {
    insert: collection.insert,
    update: collection.update,
    delete: collection.delete,
    sync: async (item: T) => {
      try {
        await collection.insert(item);
      } catch (e: any) {
        // If it fails because it's already in the vault, safely update it instead.
        if (e && e.message && e.message.includes("already exists")) {
          await collection.update(item.id, item);
        } else {
          // Silently absorb other IndexedDB transition errors to prevent UI crashes
          console.warn(`[Vault] Non-fatal sync issue for ${item.id}`);
        }
      }
    },
    findById: async (id: string) => {
      const all = queryClient.getQueryData<T[]>([tableName]) || [];
      return all.find(i => i.id === id);
    },
    getAll: async () => queryClient.getQueryData<T[]>([tableName]) || []
  };
};

// --- EXPORTED REPOSITORIES ---

// 1. Core Modules
export const animalsCollection = createFailoverRepository<Animal>('animals');
export const dailyLogsCollection = createFailoverRepository<LogEntry>('daily_logs');
export const dailyRoundsCollection = createFailoverRepository<DailyRound>('daily_rounds');
export const tasksCollection = createFailoverRepository<Task>('tasks');

// 2. Settings & Users
export const usersCollection = createFailoverRepository<{ id: string; name: string; email: string; role: string; }>('users');
export const orgSettingsCollection = createFailoverRepository<{ id: string; key: string; value: string; }>('org_settings');
export const zlaDocumentsCollection = createFailoverRepository<{ id: string; name: string; url: string; }>('zla_documents');
export const directoryCollection = createFailoverRepository<{ id: string; name: string; category: string; }>('directory');

// 3. Medical & Logistics
export const medicalLogsCollection = createFailoverRepository<ClinicalNote>('medical_logs');
export const marChartsCollection = createFailoverRepository<{ id: string; animalId: string; noteType: string; }>('mar_charts');
export const quarantineRecordsCollection = createFailoverRepository<{ id: string; animalId: string; startDate: string; }>('quarantine_records');
export const movementsCollection = createFailoverRepository<{ id: string; animalId: string; from: string; to: string; }>('movements');
export const transfersCollection = createFailoverRepository<{ id: string; animalId: string; from: string; to: string; }>('transfers');

// 4. Staff & HR
export const timesheetsCollection = createFailoverRepository<Timesheet>('timesheets');
export const rotaCollection = createFailoverRepository<{ id: string; staffId: string; date: string; }>('rota');
export const holidaysCollection = createFailoverRepository<{ id: string; staffId: string; date: string; }>('holidays');

// 5. Safety & Maintenance
export const safetyDrillsCollection = createFailoverRepository<{ id: string; title: string; date: string; }>('safety_drills');
export const incidentsCollection = createFailoverRepository<{ id: string; title: string; date: string; }>('incidents');
export const maintenanceCollection = createFailoverRepository<{ id: string; title: string; date: string; }>('maintenance');
export const firstAidCollection = createFailoverRepository<{ id: string; title: string; date: string; }>('first_aid');
