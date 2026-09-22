'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy } from 'lucide-react';
import { apiRequest } from '@/lib/api/client';
import { naira } from '@/lib/format';
import type { BankDetails, FulfillmentStatus, PaymentStatus } from '@/types';

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        } catch {
          /* clipboard blocked: the value is still on screen */
        }
      }}
      className="inline-flex min-h-11 items-center gap-2 px-3 mono"
      aria-label={`Copy ${label}`}
    >
      {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
      <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
}

export function PaymentPanel(props: {
  orderNumber: string; token: string; total: number; bank: BankDetails;
  paymentStatus: PaymentStatus; fulfillmentStatus: FulfillmentStatus; rejectionReason: string | null; hasReceipt: boolean;
}) {
  const { orderNumber, token, total, bank, paymentStatus, fulfillmentStatus, rejectionReason, hasReceipt } = props;
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [fileName, setFileName] = useState('');

  const cancelled = fulfillmentStatus === 'CANCELLED';
  const canSubmit = !cancelled && (paymentStatus === 'PENDING' || paymentStatus === 'REJECTED' || (paymentStatus === 'SUBMITTED' && !hasReceipt));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    form.set('token', token);
    if (!(form.get('receipt') instanceof File) || (form.get('receipt') as File).size === 0) form.delete('receipt');
    setBusy(true); setError('');
    const result = await apiRequest(`/api/orders/${encodeURIComponent(orderNumber)}/payment`, { method: 'POST', body: form });
    setBusy(false);
    if (!result.ok) { setError(result.message); return; }
    setDone(true);
    router.refresh();
  };

  if (cancelled) {
    return <section className="mt-10 border border-[hsl(var(--border))] p-6"><h2 className="serif text-3xl">This order was cancelled.</h2><p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">If you think this is a mistake, contact the studio with your order number.</p></section>;
  }
  if (paymentStatus === 'VERIFIED' || paymentStatus === 'REFUNDED') {
    return <section className="mt-10 border border-[hsl(var(--border))] p-6" role="status"><h2 className="serif text-3xl">{paymentStatus === 'VERIFIED' ? 'Payment verified.' : 'Payment refunded.'}</h2><p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">{paymentStatus === 'VERIFIED' ? 'Thank you. Your order is now with the studio.' : 'Your payment has been refunded.'}</p></section>;
  }

  return (
    <section className="mt-10 border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 md:p-8" aria-labelledby="pay-heading">
      <h2 id="pay-heading" className="serif text-3xl">Pay by bank transfer</h2>

      {paymentStatus === 'REJECTED' && (
        <p role="alert" className="mt-4 border border-[hsl(var(--destructive))] p-3 text-sm">We could not verify your payment{rejectionReason ? `: ${rejectionReason}` : '.'} Please check the details below and submit again.</p>
      )}
      {paymentStatus === 'SUBMITTED' && (
        <p role="status" className="mt-4 border border-[hsl(var(--accent))] bg-[hsl(var(--accent))]/10 p-3 text-sm" data-testid="text-payment-submitted">
          Thank you. Your payment is waiting for verification. We will update your order once it is confirmed. This does not mean it has been paid yet.
        </p>
      )}

      {bank.configured ? (
        <dl className="mt-6 grid gap-1 text-sm">
          {[
            ['Bank', bank.bankName, false], ['Account name', bank.accountName, false], ['Account number', bank.accountNumber, true],
            ['Amount', naira(total), true], ['Reference', orderNumber, true],
          ].map(([label, value, copy]) => (
            <div key={String(label)} className="flex items-center justify-between gap-3 border-b border-[hsl(var(--border))] py-2">
              <dt className="mono text-[hsl(var(--muted-foreground))]">{label}</dt>
              <dd className="flex items-center gap-2"><span data-testid={`bank-${String(label).toLowerCase().replace(/\s/g, '-')}`}>{value}</span>{copy && <CopyButton value={label === 'Amount' ? String(total) : String(value)} label={String(label).toLowerCase()} />}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p role="note" className="mt-6 border border-[hsl(var(--accent))] bg-[hsl(var(--accent))]/10 p-4 text-sm leading-6" data-testid="notice-bank-missing">
          The studio has not added its bank details yet. Please contact us with your order number ({orderNumber}) and we will send them to you. Amount due: {naira(total)}.
        </p>
      )}
      <p className="mt-4 text-xs leading-5 text-[hsl(var(--muted-foreground))]">Use your order number as the payment reference so we can match your transfer.</p>

      {canSubmit && !done && (
        <form onSubmit={submit} className="mt-8 grid gap-5 border-t border-[hsl(var(--border))] pt-8">
          <p className="text-sm leading-7 text-[hsl(var(--muted-foreground))]">Made the transfer? Tell us. Attaching a receipt helps us verify faster, but it is optional. Your order is not marked as paid until the studio has checked it.</p>
          <div className="grid gap-2 text-xs">
            <label htmlFor="receipt" className="mono">Payment receipt (optional, JPG, PNG, WebP or PDF, up to 4 MB)</label>
            <input ref={fileRef} id="receipt" name="receipt" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? '')} className="min-h-11 text-sm file:mr-4 file:border file:border-[hsl(var(--border))] file:bg-transparent file:px-4 file:py-2" />
            {fileName && <span className="text-[hsl(var(--muted-foreground))]">Selected: {fileName}</span>}
          </div>
          <div className="grid gap-2 text-xs">
            <label htmlFor="note" className="mono">Note (optional)</label>
            <textarea id="note" name="note" rows={2} maxLength={500} className="resize-none border-b border-[hsl(var(--border))] bg-transparent px-1 py-3 text-sm outline-none focus:border-[hsl(var(--primary))]" />
          </div>
          {error && <p role="alert" className="text-sm text-[hsl(var(--destructive))]">{error}</p>}
          <button type="submit" disabled={busy} className="min-h-12 w-fit bg-[hsl(var(--primary))] px-6 py-4 mono text-[hsl(var(--primary-foreground))] disabled:opacity-50" data-testid="button-payment-made">
            {busy ? 'Sending…' : 'I have made the payment'}
          </button>
        </form>
      )}
      {done && <p role="status" className="mt-6 text-sm">Thank you. We have let the studio know. Your payment is now awaiting verification.</p>}
    </section>
  );
}
