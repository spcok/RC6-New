import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { queryClient } from '../lib/queryClient';

export function useSupabaseRealtime() {
  useEffect(() => {
    // 1. Create a single WebSocket connection for the entire database
    const channel = supabase
      .channel('global-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          const tableName = payload.table;
          
          console.log(`[Realtime] ${payload.eventType} detected on ${tableName}. Invalidating local cache...`);
          
          // 2. Tell TanStack to instantly fetch the new data in the background
          queryClient.invalidateQueries({ 
            queryKey: [tableName],
            // EXACT Match ensures we don't accidentally invalidate nested/unrelated queries
            exact: true 
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] WebSocket connected. Listening for cloud syncs.');
        }
      });

    // 3. Cleanup the socket if the app unmounts
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
