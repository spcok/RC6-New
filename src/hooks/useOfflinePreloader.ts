import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { getUKLocalDate } from '../services/temporalService';
import { useAuthStore } from '../store/authStore';

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
      const animalsRes = await supabase.from('animals').select('*').eq('status', 'ACTIVE');
      console.log('📊 [Supabase Payload] Animals:', animalsRes.data, '| Error:', animalsRes.error);
      
      await queryClient.prefetchQuery({
        queryKey: ['animals'],
        queryFn: async () => {
          return animalsRes.data || [];
        },
        staleTime: 1000 * 60 * 60 * 24 // Consider fresh for 24 hours
      });

      // 2. Preload Operational Lists
      await queryClient.prefetchQuery({
        queryKey: ['operational_lists'],
        queryFn: async () => {
          const { data, error } = await supabase.from('operational_lists').select('*').eq('is_deleted', false);
          console.log('📊 [Supabase Payload] Operational Lists:', data, '| Error:', error);
          return data || [];
        }
      });

      // 3. Preload Users
      const usersRes = await supabase.from('users').select('*');
      console.log('📊 [Supabase Payload] Users:', usersRes.data, '| Error:', usersRes.error);

      // 4. Preload Today's Logs
      const today = getUKLocalDate();
      await queryClient.prefetchQuery({
        queryKey: ['daily_logs', 'today', undefined],
        queryFn: async () => {
          const { data } = await supabase.from('daily_logs').select('*').eq('log_date', today).eq('is_deleted', false);
          return data || [];
        }
      });

      console.log('✅ Offline cache hydrated successfully.');
      setIsReady(true);
    };

    prefetchCriticalData();
  }, [session, queryClient]);

  return { isReady };
};
