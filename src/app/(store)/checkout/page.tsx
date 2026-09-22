import type { Metadata } from 'next';
import { CheckoutForm } from '@/components/checkout/checkout-form';
import { getSiteSettings } from '@/lib/settings/queries';

export const metadata: Metadata = { title: 'Checkout', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const { shippingRates } = await getSiteSettings();
  return (
    <main className="mx-auto max-w-[1200px] px-5 py-12 md:px-10 md:py-20">
      <span className="mono text-[hsl(var(--accent))]">Checkout</span>
      <h1 className="serif mt-4 text-5xl md:text-7xl">Almost yours.</h1>
      <CheckoutForm rates={shippingRates} />
    </main>
  );
}
