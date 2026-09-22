'use client';

import { useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LoziaImage } from '@/components/lozia-image';
import { TextArea, TextField, firstError } from '@/components/forms/fields';
import { useCart } from '@/hooks/use-cart';
import { apiRequest, jsonBody } from '@/lib/api/client';
import { track } from '@/lib/analytics';
import { naira } from '@/lib/format';
import { calculateShippingFee } from '@/lib/shipping/fee';
import { NIGERIAN_STATES } from '@/lib/shipping/states';
import type { ShippingRates } from '@/types';

type Created = { orderNumber: string; token: string };

export function CheckoutForm({ rates }: { rates: ShippingRates }) {
  const router = useRouter();
  const cart = useCart();
  const [state, setState] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const shippingFee = useMemo(() => (state ? calculateShippingFee(rates, state, cart.subtotal) : 0), [rates, state, cart.subtotal]);
  const total = cart.subtotal + shippingFee;

  if (!cart.hydrated) return <div className="mt-12 min-h-[40vh]" aria-busy="true" />;

  if (cart.items.length === 0) {
    return (
      <div className="mt-12 max-w-[460px]">
        <h2 className="serif text-4xl">Your bag is quiet.</h2>
        <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">Add a piece to begin.</p>
        <Link href="/shop" className="mt-7 inline-flex min-h-12 items-center border border-[hsl(var(--primary))] px-6 mono">Explore the collection</Link>
      </div>
    );
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = (name: string) => String(data.get(name) ?? '');
    setBusy(true); setError(''); setFieldErrors({});

    // Only ids and quantities are sent. The server looks up prices, stock and delivery fees itself.
    const result = await apiRequest<Created>('/api/orders', {
      method: 'POST',
      body: jsonBody({
        customer: { fullName: text('fullName'), email: text('email'), phone: text('phone') },
        delivery: { address: text('address'), city: text('city'), state: text('state'), instructions: text('instructions') || undefined },
        items: cart.items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
      }),
    });
    setBusy(false);

    if (!result.ok) {
      setError(result.message);
      setFieldErrors(result.fieldErrors);
      return;
    }
    track({ name: 'order_created', props: { items: cart.count } });
    cart.clear();
    router.push(`/order-confirmed?order=${encodeURIComponent(result.data.orderNumber)}&token=${encodeURIComponent(result.data.token)}`);
  };

  return (
    <form onSubmit={submit} className="mt-12 grid gap-12 md:grid-cols-[1.2fr_.8fr]" noValidate>
      <div className="grid gap-10">
        <fieldset className="grid gap-5">
          <legend className="serif text-3xl">Contact</legend>
          <TextField id="fullName" name="fullName" label="Full name" required autoComplete="name" error={firstError(fieldErrors, 'customer.fullName')} />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField id="email" name="email" type="email" label="Email" required autoComplete="email" error={firstError(fieldErrors, 'customer.email')} />
            <TextField id="phone" name="phone" type="tel" label="Phone number" required autoComplete="tel" error={firstError(fieldErrors, 'customer.phone')} />
          </div>
        </fieldset>

        <fieldset className="grid gap-5">
          <legend className="serif text-3xl">Delivery</legend>
          <TextField id="address" name="address" label="Delivery address" required autoComplete="street-address" error={firstError(fieldErrors, 'delivery.address')} />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField id="city" name="city" label="City" required autoComplete="address-level2" error={firstError(fieldErrors, 'delivery.city')} />
            <div className="grid gap-2 text-xs">
              <label htmlFor="state" className="mono">State</label>
              <select id="state" name="state" required value={state} onChange={(event) => setState(event.target.value)} autoComplete="address-level1"
                aria-invalid={Boolean(firstError(fieldErrors, 'delivery.state'))} className="min-h-11 border-b border-[hsl(var(--border))] bg-transparent px-1 py-3 text-sm">
                <option value="" disabled>Choose a state</option>
                {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {firstError(fieldErrors, 'delivery.state') && <span role="alert" className="text-[hsl(var(--destructive))]">{firstError(fieldErrors, 'delivery.state')}</span>}
            </div>
          </div>
          <TextArea id="instructions" name="instructions" label="Delivery instructions (optional)" rows={3} />
        </fieldset>

        <section aria-labelledby="pay-heading">
          <h2 id="pay-heading" className="serif text-3xl">Payment</h2>
          <p className="mt-3 max-w-[480px] text-sm leading-7 text-[hsl(var(--muted-foreground))]">Payment is by bank transfer. After you place your order we will show you the account details and the exact amount. Your order is confirmed once we have verified your transfer.</p>
        </section>
      </div>

      <aside className="h-fit border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 md:sticky md:top-6" aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="serif text-3xl">Order summary</h2>
        <ul className="mt-5 divide-y divide-[hsl(var(--border))]">
          {cart.items.map((item) => (
            <li key={item.variantId} className="flex gap-4 py-4">
              <div className="relative h-24 w-[4.5rem] shrink-0 bg-[hsl(var(--muted))]"><LoziaImage src={item.image} alt={item.name} fill sizes="72px" className="object-cover" /></div>
              <div className="flex-1 text-sm">
                <p className="serif text-lg">{item.name}</p>
                <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{item.colourName} · {item.sizeName} · ×{item.quantity}</p>
              </div>
              <p className="text-sm">{naira(item.unitPrice * item.quantity)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-4 grid gap-2 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{naira(cart.subtotal)}</dd></div>
          <div className="flex justify-between">
            <dt>Delivery</dt>
            <dd>{!state ? 'Choose a state' : rates.placeholder ? 'To be confirmed' : shippingFee === 0 ? 'Free' : naira(shippingFee)}</dd>
          </div>
          <div className="flex justify-between border-t border-[hsl(var(--border))] pt-3 text-base"><dt>Total</dt><dd data-testid="text-checkout-total">{naira(total)}</dd></div>
        </dl>
        <p className="mt-3 text-xs leading-5 text-[hsl(var(--muted-foreground))]">Prices and stock are confirmed by our system when you place the order.</p>

        {error && <p role="alert" className="mt-5 border border-[hsl(var(--destructive))] p-3 text-sm text-[hsl(var(--destructive))]" data-testid="text-checkout-error">{error}</p>}
        <button type="submit" disabled={busy} className="mt-6 min-h-12 w-full bg-[hsl(var(--primary))] px-6 py-4 mono text-[hsl(var(--primary-foreground))] disabled:opacity-50" data-testid="button-place-order">
          {busy ? 'Placing your order…' : 'Place order'}
        </button>
      </aside>
    </form>
  );
}
