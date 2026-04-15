import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { getUKLocalDate } from '../services/temporalService';
import { useAuthStore } from '../store/authStore';
import { mapToCamelCase } from '../lib/dataMapping';
import { 
  animalsCollection, 
  dailyLogsCollection, 
  usersCollection 
} from '../lib/db';
import { operationalListsCollection } from '../lib/db/collections/operationalLists';

const upsertToCollection = async (collection: any, data: any[]) => {
  if (!data || !Array.isArray(data)) return;
  
  // In a local-first IDB setup, it is often safest to clear and rewrite 
  // to guarantee exact synchronization with Supabase, or rely on the engine's built-in deduplication.
  try {
    // Optional: If the collection supports bulk inserts
    await collection.insertMany(data);
  } catch (e) {
    // Fallback to individual inserts if insertMany is missing
    for (const item of data) {
      try {
          await collection.insert(item);
      } catch (err) {
          console.error(`Failed to insert item ${item.id}`, err);
      }
    }
  }
};

export const useOfflinePreloader = () => {
  const queryClient = useQueryClient();
  const { session } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!session) return;
    // if (!navigator.onLine) return;

    const prefetchCriticalData = async () => {
      console.log('📡 [Sync] Force-starting hydration...');
      
      // 1. Preload Active Animals
      const animalsRes = await supabase.from('animals').select('id, name, species, category, is_deleted');
      console.log('📊 [Supabase Payload] Animals:', animalsRes.data, '| Error:', animalsRes.error);
      if (animalsRes.data) {
        const mappedAnimals = animalsRes.data.map(mapToCamelCase);
        await upsertToCollection(animalsCollection, mappedAnimals);
      }
      
      // 2. Preload Operational Lists
      const listsRes = await supabase.from('operational_lists').select('*').eq('is_deleted', false);
      console.log('📊 [Supabase Payload] Operational Lists:', listsRes.data, '| Error:', listsRes.error);
      if (listsRes.data) {
        const mappedLists = listsRes.data.map(mapToCamelCase);
        await upsertToCollection(operationalListsCollection, mappedLists);
      }

      // 3. Preload Users
      const usersRes = await supabase.from('users').select('*');
      console.log('📊 [Supabase Payload] Users:', usersRes.data, '| Error:', usersRes.error);
      if (usersRes.data) {
        const mappedUsers = usersRes.data.map(mapToCamelCase);
        await upsertToCollection(usersCollection, mappedUsers);
      }

      // 4. Preload Today's Logs
      const today = getUKLocalDate();
      const logsRes = await supabase.from('daily_logs').select('*').eq('log_date', today).eq('is_deleted', false);
      console.log('📊 [Supabase Payload] Daily Logs:', logsRes.data, '| Error:', logsRes.error);
      if (logsRes.data) {
        const mappedLogs = logsRes.data.map(mapToCamelCase);
        await upsertToCollection(dailyLogsCollection, mappedLogs);
      }

      console.log('✅ Offline cache hydrated successfully.');
      setIsReady(true);
    };

    prefetchCriticalData();
  }, [session, queryClient]);

  return { isReady };
};
