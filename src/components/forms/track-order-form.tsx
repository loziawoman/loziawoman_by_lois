'use client';

import { useState, type FormEvent } from 'react';
import { apiRequest, jsonBody } from '@/lib/api/client';
import { naira } from '@/lib/format';
import { describeOrder } from '@/lib/orders/status';
import type { CustomerOrderView } from '@/types';
import { TextField, firstError } from './fields';

export function TrackOrderForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [order, setOrder] = useState<CustomerOrderView | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true); setError(''); setFieldErrors({}); setOrder(null);
    const result = await apiRequest<CustomerOrderView>('/api/orders/lookup', {
      method: 'POST', body: jsonBody({ orderNumber: data.get('orderNumber'), email: data.get('email') }),
    });
    setBusy(false);
    if (result.ok) setOrder(result.data);
    else { setError(result.message); setFieldErrors(result.fieldErrors); }
  };

  return (
    <div>
      <form onSubmit={submit} className="mt-10 grid gap-5" noValidate>
        <TextField id="track-number" name="orderNumber" label="Order number" placeholder="LOZ-20260918-8F42" required autoComplete="off" error={firstError(fieldErrors, 'orderNumber')} />
        <TextField id="track-email" name="email" type="email" label="Email" required autoComplete="email" error={firstError(fieldErrors, 'email')} />
        {error && <p role="alert" className="text-sm text-[hsl(var(--destructive))]">{error}</p>}
        <button type="submit" disabled={busy} className="mt-2 min-h-12 w-fit bg-[hsl(var(--primary))] px-6 py-4 mono text-[hsl(var(--primary-foreground))] disabled:opacity-50">{busy ? 'Looking…' : 'Find my order'}</button>
      </form>

      {order && (
        <section className="mt-12 border-t border-[hsl(var(--border))] pt-8" aria-live="polite" data-testid="track-result">
          <span className="mono text-[hsl(var(--accent))]">{order.orderNumber}</span>
          <h2 className="serif mt-3 text-4xl">{describeOrder({ payment: order.paymentStatus, fulfillment: order.fulfillmentStatus })}</h2>
          {order.rejectionReason && order.paymentStatus === 'REJECTED' && <p className="mt-3 text-sm">About your payment: {order.rejectionReason}</p>}
          <ul className="mt-6 divide-y divide-[hsl(var(--border))]">
            {order.items.map((item, i) => (
              <li key={i} className="flex justify-between gap-4 py-3 text-sm"><span>{item.productName} · {item.colourName} · {item.sizeName} · ×{item.quantity}</span><span>{naira(item.lineTotal)}</span></li>
            ))}
          </ul>
          <p className="mt-4 flex justify-between text-sm"><span>Total</span><span>{naira(order.total)}</span></p>
          {(order.paymentStatus === 'PENDING' || order.paymentStatus === 'REJECTED') && (
            <p className="mt-6 text-sm text-[hsl(var(--muted-foreground))]">To pay or send a receipt, use the link on your order confirmation, or contact the studio with your order number.</p>
          )}
        </section>
      )}
    </div>
  );
}
