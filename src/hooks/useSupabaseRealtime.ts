import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { queryClient } from '../lib/queryClient';

export const useSupabaseRealtime = () => {
  useEffect(() => {
    const channel = supabase
      .channel('global-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          console.log('Realtime change received:', payload);
          const table = payload.table;
          
          // Invalidate relevant queries based on the table
          if (table === 'animals') {
            queryClient.invalidateQueries({ queryKey: ['animals'] });
            queryClient.invalidateQueries({ queryKey: ['animal'] });
          } else if (table === 'tasks') {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
          } else if (table === 'clinical_notes') {
            queryClient.invalidateQueries({ queryKey: ['clinical_notes'] });
          } else if (table === 'mar_charts') {
            queryClient.invalidateQueries({ queryKey: ['mar_charts'] });
          } else if (table === 'quarantine_records') {
            queryClient.invalidateQueries({ queryKey: ['quarantine_records'] });
          } else if (table === 'timesheets') {
            queryClient.invalidateQueries({ queryKey: ['timesheets'] });
          } else {
            // Fallback: invalidate everything if we're not sure
            queryClient.invalidateQueries();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'daily_logs' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['daily_logs'] });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'daily_logs' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['daily_logs'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
};