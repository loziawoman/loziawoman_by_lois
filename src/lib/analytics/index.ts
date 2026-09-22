// Privacy-conscious analytics boundary. Events carry ids and choices, never names, emails, phone numbers or addresses.
// Choose a provider with NEXT_PUBLIC_ANALYTICS_PROVIDER: "none" (default), "console" (development) or "plausible".

export type AnalyticsEvent =
  | { name: 'product_viewed'; props: { slug: string } }
  | { name: 'colour_selected'; props: { slug: string; colour: string } }
  | { name: 'size_selected'; props: { slug: string; size: string } }
  | { name: 'add_to_cart'; props: { slug: string; quantity: number } }
  | { name: 'checkout_started'; props: { items: number } }
  | { name: 'order_created'; props: { items: number } };

type Plausible = (event: string, options?: { props: Record<string, string | number> }) => void;

export function track(event: AnalyticsEvent): void {
  if (typeof window === 'undefined') return;
  const provider = process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER ?? 'none';
  if (provider === 'console') console.info('[analytics]', event.name, event.props);
  if (provider === 'plausible') (window as unknown as { plausible?: Plausible }).plausible?.(event.name, { props: event.props });
}
