'use client';

import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { CmsProvider } from '@/hooks/use-cms';
import { BagProvider } from '@/hooks/use-store';
import type { CmsWorkspace } from '@/lib/cms';

export function Providers({ workspace, children }: { workspace: CmsWorkspace; children: ReactNode }) {
  // Created once per browser session (not per render, and never shared between server requests).
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CmsProvider workspace={workspace}>
          <BagProvider>{children}</BagProvider>
        </CmsProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
