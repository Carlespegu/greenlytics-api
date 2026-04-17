import type { PropsWithChildren } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from '@/app/queryClient';
import { AuthProvider } from '@/modules/auth/hooks/AuthProvider';
import { ActiveClientProvider } from '@/modules/clients/hooks/ActiveClientContext';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ActiveClientProvider>{children}</ActiveClientProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
