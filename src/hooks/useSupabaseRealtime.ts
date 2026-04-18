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
          
          if (payload.eventType === 'INSERT') {
            const newItem = mapToCamelCase(payload.new);
            queryClient.setQueryData([tableName], (oldData: unknown[]) => {
              return oldData ? [...oldData, newItem] : [newItem];
            });
          } 
          else if (payload.eventType === 'UPDATE') {
            const updatedItem = mapToCamelCase(payload.new);
            queryClient.setQueryData([tableName], (oldData: unknown[]) => {
              if (!oldData) return [updatedItem];
              return oldData.map((item: unknown) => (item as { id: string }).id === updatedItem.id ? updatedItem : item);
            });
          } 
          else if (payload.eventType === 'DELETE') {
            queryClient.setQueryData([tableName], (oldData: unknown[]) => {
              if (!oldData) return [];
              return oldData.filter((item: unknown) => (item as { id: string }).id !== payload.old.id);
            });
          }
        }
      )
      // FIX: Explicitly providing the callback prevents Supabase from crashing 
      // when proxy interceptors or incognito mode block the WebSocket.
      .subscribe((status, err) => {
        if (err) {
          console.warn('[Realtime] WebSocket blocked or degraded (Safe to ignore in offline-first mode):', err);
        } else {
          console.log(`[Realtime] Connection Status: ${status}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
