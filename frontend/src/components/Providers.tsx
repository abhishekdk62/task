'use client';

import { useRef } from 'react';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { makeStore, AppStore } from '@/store';
import { AuthHydrator } from '@/components/AuthHydrator';
import { ToastProvider } from '@/components/ToastProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);
  const queryRef = useRef<QueryClient | null>(null);

  if (!storeRef.current) {
    storeRef.current = makeStore();
  }
  if (!queryRef.current) {
    queryRef.current = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 15_000,
          retry: 1,
          refetchOnWindowFocus: false,
        },
      },
    });
  }

  return (
    <Provider store={storeRef.current}>
      <QueryClientProvider client={queryRef.current}>
        <ToastProvider>
          <AuthHydrator />
          {children}
        </ToastProvider>
      </QueryClientProvider>
    </Provider>
  );
}
