'use client';

import type { ReactNode } from 'react';
import { BagDrawer, Footer, Header, WhatsAppFloat } from '@/components/lozia-shell';

/** Header, footer, bag drawer and WhatsApp button that wrap every storefront page. */
export function StoreShell({ children }: { children: ReactNode }) {
  return (
    <div className="grain min-h-[100dvh]">
      <Header />
      {children}
      <Footer />
      <BagDrawer />
      <WhatsAppFloat />
    </div>
  );
}
