import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { queryClient } from '../lib/queryClient';
import { mapToCamelCase } from '../lib/dataMapping';

export function useSupabaseRealtime() {
  useEffect(() => {
    const channel = supabase
      .channel('global-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          const tableName = payload.table;
          
          // SURGICAL CACHE INJECTION: No network refetch required!
          if (payload.eventType === 'INSERT') {
            const newItem = mapToCamelCase(payload.new);
            queryClient.setQueryData([tableName], (oldData: unknown[] | undefined) => {
              return oldData ? [...oldData, newItem] : [newItem];
            });
          } 
          else if (payload.eventType === 'UPDATE') {
            const updatedItem = mapToCamelCase(payload.new as Record<string, unknown>);
            queryClient.setQueryData([tableName], (oldData: unknown[] | undefined) => {
              if (!oldData) return [updatedItem];
              return oldData.map((item: any) => item.id === updatedItem.id ? updatedItem : item);
            });
          } 
          else if (payload.eventType === 'DELETE') {
            queryClient.setQueryData([tableName], (oldData: unknown[] | undefined) => {
              if (!oldData) return [];
              return oldData.filter((item: any) => item.id !== payload.old.id);
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
