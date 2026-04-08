import { useQuery } from '@tanstack/react-query';
import { getFullWeather, FullWeatherData } from '../../../services/weatherService';

/**
 * useWeatherSync
 * 
 * Refactored to be a read-only data fetcher.
 * ZLA environmental temperature logging has been offloaded to a backend Supabase Edge Function (pg_cron).
 * This hook now serves as a passive provider of live weather data for the UI.
 */
export const useWeatherSync = () => {
  const { data, isLoading, error } = useQuery<FullWeatherData>({
    queryKey: ['weather', 'Maidstone'],
    queryFn: () => getFullWeather('Maidstone, Kent, UK'),
    staleTime: 1000 * 60 * 15, // Cache for 15 minutes
    refetchInterval: 1000 * 60 * 30, // Refresh every 30 minutes
  });

  return {
    data,
    isLoading,
    error: error ? 'STATION OFFLINE' : null,
    isSyncing: isLoading // Maintained for backward compatibility with DailyLog.tsx
  };
};
