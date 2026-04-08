import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { queryClient } from './lib/queryClient';
import { useAuthStore } from './store/authStore';
import { router } from './router';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  const initialize = useAuthStore(state => state.initialize);
  const currentUser = useAuthStore(state => state.currentUser);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const authContext = {
    isAuthenticated: !!currentUser,
    permissions: currentUser?.permissions,
  };

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} context={{ auth: authContext }} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
