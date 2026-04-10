import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { get, set, del } from 'idb-keyval';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5-minute stale time prevents redundant Supabase fetches.
      staleTime: 1000 * 60 * 5, 
      gcTime: 1000 * 60 * 60 * 24 * 14, // 14-day garbage collection
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      networkMode: 'offlineFirst',
      retry: 2,
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
});

// OFFICIAL OFFLINE-FIRST PERSISTER
// This physically bolts the RAM cache to the browser's hard drive (IndexedDB)
const indexedDBPersister = createAsyncStoragePersister({
  storage: {
    getItem: async (key) => await get(key),
    setItem: async (key, value) => await set(key, value),
    removeItem: async (key) => await del(key),
  },
});

persistQueryClient({
  queryClient,
  persister: indexedDBPersister,
  maxAge: 1000 * 60 * 60 * 24 * 14, // Force hard drive retention to match gcTime
});
