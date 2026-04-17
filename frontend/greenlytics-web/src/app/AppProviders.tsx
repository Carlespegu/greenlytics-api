import type { PropsWithChildren } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';

import { LanguageProvider } from '@/app/i18n/LanguageProvider';
import { queryClient } from '@/app/queryClient';
import { AuthProvider } from '@/modules/auth/hooks/AuthProvider';
import { ActiveClientProvider } from '@/modules/clients/hooks/ActiveClientContext';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <ActiveClientProvider>{children}</ActiveClientProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
