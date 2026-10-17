'use client';

import type { ReactNode } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { DialogProvider } from '@/components/ui/dialog-provider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <DialogProvider>
        {children}
        <Toaster />
      </DialogProvider>
    </TooltipProvider>
  );
}
