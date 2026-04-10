import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // FIX: 5-minute stale time prevents redundant Supabase fetches.
      // The local TanStack DB vault will serve instantly during this window.
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

