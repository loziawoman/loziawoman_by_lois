import type { ReactNode } from 'react';
import type { SiteSettings } from '@/types';
import { CartProvider } from '@/hooks/use-cart';
import { CartDrawer } from './cart-drawer';
import { Footer } from './footer';
import { Header } from './header';
import { WhatsAppButton } from './whatsapp-button';

/** Header, footer, bag drawer and WhatsApp button around every storefront page. */
export function StoreShell({
  settings,
  children,
}: {
  settings: SiteSettings;
  children: ReactNode;
}) {
  return (
    <CartProvider>
      <div className="grain min-h-[100dvh]">
        <Header brandName={settings.brandName} />

        <div id="main" tabIndex={-1} className="outline-none">
          {children}
        </div>

        <Footer settings={settings} />

        <CartDrawer />

        <WhatsAppButton
          number={settings.whatsappNumber}
          message={settings.whatsappMessage}
        />
      </div>
    </CartProvider>
  );
}
