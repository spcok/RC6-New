import { createCollection as baseCreateCollection } from '@tanstack/react-db';
import { queryClient } from './queryClient';
import { supabase } from './supabase';
import { LogEntry, Animal, Timesheet, Task, ClinicalNote } from '../types';
import { mapToCamelCase } from './dataMapping';

export interface TanStackCollection<T> {
  insert: (item: T) => Promise<void>;
  update: (draft: Partial<T> & { id: string }) => Promise<void>;
  delete: (id: string) => Promise<void>;
  getAll: () => Promise<T[]>;
  findById: (id: string) => Promise<T | undefined>;
}

// --- COLLECTION FACTORY ---
export const createStandardCollection = <T extends { id: string }>(tableName: string): TanStackCollection<T> => {
  const collection = baseCreateCollection<T, string>({
    queryKey: [tableName],
    queryClient,
    getKey: (item: T) => item.id,
    queryFn: async () => {
      const { data, error } = await supabase.from(tableName).select('*').eq('is_deleted', false).limit(5000);
      if (error) throw error;
      return (data as Record<string, unknown>[]).map(item => mapToCamelCase<T>(item)) || [];
    },
    sync: {},
    // ARCHITECTURAL FIX: Dummy handlers satisfy the library's local insert validation 
    // without triggering rogue network requests. TanStack Query still handles the network.
    onInsert: async () => { return; },
    onUpdate: async () => { return; },
    onDelete: async () => { return; }
  });

  const singleDraftUpdate = async (draft: Partial<T> & { id: string }) => {
    await collection.update(draft.id, draft);
  };

  return {
    insert: collection.insert,
    update: singleDraftUpdate,
    delete: collection.delete,
    getAll: async () => queryClient.getQueryData<T[]>([tableName]) || [],
    findById: async (id: string) => {
      const all = queryClient.getQueryData<T[]>([tableName]) || [];
      return all.find((item: T) => item.id === id);
    }
  };
};

// 1. Animals Collection
export const animalsCollection = createStandardCollection<Animal>('animals');

// 2. Daily Logs Collection
export const dailyLogsCollection = (() => {
  const collection = baseCreateCollection<LogEntry, string>({
    queryKey: ['daily_logs'],
    queryClient,
    getKey: (item: LogEntry) => item.id!,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('is_deleted', false)
        .limit(5000); 
      if (error) throw error;
      return (data as Record<string, unknown>[]).map(item => mapToCamelCase<LogEntry>(item)) || [];
    },
    sync: {},
    // ARCHITECTURAL FIX: Dummy handlers
    onInsert: async () => { return; },
    onUpdate: async () => { return; },
    onDelete: async () => { return; }
  });

  const singleDraftUpdate = async (draft: Partial<LogEntry> & { id: string }) => {
    await collection.update(draft.id, draft);
  };

  return {
    insert: collection.insert,
    update: singleDraftUpdate,
    delete: collection.delete,
    getAll: async () => queryClient.getQueryData<LogEntry[]>(['daily_logs']) || [],
    findById: async (id: string) => {
      const all = queryClient.getQueryData<LogEntry[]>(['daily_logs']) || [];
      return all.find((item: LogEntry) => item.id === id);
    }
  };
})();

// 3. Tasks Collection
export const tasksCollection = createStandardCollection<Task>('tasks');

// --- SETTINGS & USERS MODULES ---
export const usersCollection = createStandardCollection<{ id: string; name: string; email: string; role: string; }>('users');
export const orgSettingsCollection = createStandardCollection<{ id: string; key: string; value: string; }>('org_settings');
export const zlaDocumentsCollection = createStandardCollection<{ id: string; name: string; url: string; }>('zla_documents');
export const directoryCollection = createStandardCollection<{ id: string; name: string; category: string; }>('directory');

// --- MEDICAL & LOGISTICS MODULES ---
export const medicalLogsCollection = createStandardCollection<ClinicalNote>('medical_logs');
export const marChartsCollection = createStandardCollection<{ id: string; animalId: string; noteType: string; }>('mar_charts');
export const quarantineRecordsCollection = createStandardCollection<{ id: string; animalId: string; startDate: string; }>('quarantine_records');
export const movementsCollection = createStandardCollection<{ id: string; animalId: string; from: string; to: string; }>('movements');
export const transfersCollection = createStandardCollection<{ id: string; animalId: string; from: string; to: string; }>('transfers');

// --- STAFF MODULES ---
export const timesheetsCollection = createStandardCollection<Timesheet>('timesheets');
export const rotaCollection = createStandardCollection<{ id: string; staffId: string; date: string; }>('rota');
export const holidaysCollection = createStandardCollection<{ id: string; staffId: string; date: string; }>('holidays');

// --- SAFETY MODULES ---
export const safetyDrillsCollection = createStandardCollection<{ id: string; title: string; date: string; }>('safety_drills');
export const incidentsCollection = createStandardCollection<{ id: string; title: string; date: string; }>('incidents');
export const maintenanceCollection = createStandardCollection<{ id: string; title: string; date: string; }>('maintenance');
export const firstAidCollection = createStandardCollection<{ id: string; title: string; date: string; }>('first_aid');
