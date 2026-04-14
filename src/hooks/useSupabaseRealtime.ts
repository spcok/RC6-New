import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { queryClient } from '../lib/queryClient';

export function useSupabaseRealtime() {
  useEffect(() => {
    // 1. React 19 / HMR FIX: Forcefully remove any existing channel with this name
    // before creating a new one, preventing the "after subscribe" crash.
    supabase.removeChannel(supabase.channel('global-db-changes'));

    // 2. Create a completely fresh channel
    const channel = supabase.channel('global-db-changes');

    // 3. ALWAYS attach .on() listeners BEFORE calling .subscribe()
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public' },
      (payload) => {
        console.log('🔄 [Realtime] Change detected:', payload);
        if (payload.table) {
          // Standard TanStack Query invalidation to trigger UI updates
          queryClient.invalidateQueries({ queryKey: [payload.table] });
        }
      }
    ).subscribe((status, err) => {
      console.log(`[Realtime] Connection Status: ${status}`);
      if (err) console.error('[Realtime] Error:', err);
    });

    // 4. Clean up gracefully on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
