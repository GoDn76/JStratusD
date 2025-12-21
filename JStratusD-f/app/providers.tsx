"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import React from 'react';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Set a sensible staleTime so React Query doesn't constantly refetch on mount
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    // Provide the client to your app
    <QueryClientProvider client={queryClient}>
      {children}
      
      {/* Optional: React Query Devtools for debugging in development
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />} */}
    </QueryClientProvider>
  );
}
