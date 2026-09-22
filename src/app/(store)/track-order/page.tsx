import type { Metadata } from 'next';
import { TrackOrderForm } from '@/components/forms/track-order-form';

export const metadata: Metadata = { title: 'Track an order', robots: { index: false, follow: true } };

export default function TrackOrderPage() {
  return (
    <main className="mx-auto max-w-[760px] px-5 py-20 md:px-10 md:py-32">
      <span className="mono text-[hsl(var(--accent))]">Your order</span>
      <h1 className="serif mt-5 text-6xl md:text-8xl">Track an order.</h1>
      <p className="mt-6 max-w-[520px] text-sm leading-7 text-[hsl(var(--muted-foreground))]">Enter the order number from your confirmation and the email address you used at checkout.</p>
      <TrackOrderForm />
    </main>
  );
}
