import { useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { queryClient } from './lib/queryClient';
import { useAuthStore } from './store/authStore';
import { router } from './router';
import ErrorBoundary from './components/ErrorBoundary';
import { useSupabaseRealtime } from './hooks/useSupabaseRealtime';

// 1. THE OS EVICTION LOCK
function useStoragePersistence() {
  useEffect(() => {
    async function requestPersistence() {
      if (navigator.storage && navigator.storage.persist) {
        const isPersisted = await navigator.storage.persisted();
        if (!isPersisted) {
          const granted = await navigator.storage.persist();
          console.log(`[Storage] Persistent storage granted: ${granted}`);
        } else {
          console.log('[Storage] Vault is already locked & persistent.');
        }
      }
    }
    requestPersistence();
  }, []);
}

function GlobalHooks() {
  useSupabaseRealtime();
  useStoragePersistence();
  return null;
}

export default function App() {
  const initialize = useAuthStore(state => state.initialize);
  const currentUser = useAuthStore(state => state.currentUser);

  // 2. THE HYDRATION LOCK
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    initialize().finally(() => {
      setIsHydrated(true);
    });
  }, [initialize]);

  if (!isHydrated) return null; 

  const authContext = {
    isAuthenticated: !!currentUser,
    permissions: currentUser?.permissions,
  };

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GlobalHooks />
        <RouterProvider router={router} context={{ auth: authContext }} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
