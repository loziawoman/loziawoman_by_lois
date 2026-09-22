'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, jsonBody } from '@/lib/api/client';
import type { OrderAction } from '@/lib/orders/status';
import { btnCls, btnGhostCls, inputCls, Panel } from './ui';

const LABEL: Record<OrderAction, string> = {
  verify_payment: 'Verify payment', reject_payment: 'Reject payment', mark_shipped: 'Mark as shipped',
  mark_delivered: 'Mark as delivered', cancel: 'Cancel order', refund: 'Mark refunded',
};

export function OrderActions({ orderId, actions, hasReceipt }: { orderId: string; actions: OrderAction[]; hasReceipt: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [reason, setReason] = useState('');
  const [carrier, setCarrier] = useState('');
  const [tracking, setTracking] = useState('');
  const [note, setNote] = useState('');

  const run = async (body: Record<string, unknown>, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true); setMessage('');
    const result = await apiRequest(`/api/admin/orders/${orderId}`, { method: 'POST', body: jsonBody(body) });
    setBusy(false);
    if (!result.ok) { setMessage(result.message); return; }
    setReason(''); setNote('');
    setMessage('Saved.');
    router.refresh();
  };

  const openReceipt = async () => {
    const result = await apiRequest<{ url: string }>(`/api/admin/orders/${orderId}/receipt`);
    if (result.ok) window.open(result.data.url, '_blank', 'noopener,noreferrer');
    else setMessage(result.message);
  };

  return (
    <Panel title="Actions">
      <div className="grid gap-4">
        {hasReceipt && <button type="button" onClick={openReceipt} className={btnGhostCls} data-testid="button-view-receipt">View uploaded receipt</button>}

        {actions.includes('verify_payment') && (
          <button type="button" disabled={busy} className={btnCls} data-testid="button-verify-payment"
            onClick={() => run({ action: 'verify_payment' }, 'Verify this payment? Stock will be committed and the order will move to processing.')}>{LABEL.verify_payment}</button>
        )}
        {(actions.includes('reject_payment') || actions.includes('cancel')) && (
          <div className="grid gap-2">
            <label htmlFor="reason" className="mono">Reason (sent to the customer for rejections)</label>
            <input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} className={inputCls} />
            <div className="flex flex-wrap gap-2">
              {actions.includes('reject_payment') && <button type="button" disabled={busy || reason.trim().length < 3} className={btnGhostCls} data-testid="button-reject-payment" onClick={() => run({ action: 'reject_payment', reason })}>{LABEL.reject_payment}</button>}
              {actions.includes('cancel') && <button type="button" disabled={busy || reason.trim().length < 3} className={btnGhostCls} onClick={() => run({ action: 'cancel', reason }, 'Cancel this order and release its stock?')}>{LABEL.cancel}</button>}
            </div>
          </div>
        )}
        {actions.includes('mark_shipped') && (
          <div className="grid gap-2">
            <label htmlFor="carrier" className="mono">Carrier</label><input id="carrier" value={carrier} onChange={(e) => setCarrier(e.target.value)} className={inputCls} />
            <label htmlFor="tracking" className="mono">Tracking number</label><input id="tracking" value={tracking} onChange={(e) => setTracking(e.target.value)} className={inputCls} />
            <button type="button" disabled={busy} className={btnCls} onClick={() => run({ action: 'mark_shipped', carrier: carrier || undefined, tracking: tracking || undefined })}>{LABEL.mark_shipped}</button>
          </div>
        )}
        {actions.includes('mark_delivered') && <button type="button" disabled={busy} className={btnCls} onClick={() => run({ action: 'mark_delivered' })}>{LABEL.mark_delivered}</button>}
        {actions.includes('refund') && <button type="button" disabled={busy} className={btnGhostCls} onClick={() => run({ action: 'refund' }, 'Mark this order as refunded? Only do this after the money has been sent back.')}>{LABEL.refund}</button>}

        <div className="grid gap-2 border-t border-[hsl(var(--border))] pt-4">
          <label htmlFor="note" className="mono">Admin note (internal)</label>
          <textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
          <button type="button" disabled={busy || !note.trim()} className={btnGhostCls} onClick={() => run({ action: 'add_note', note })}>Add note</button>
        </div>
        {message && <p role="status" className="text-sm">{message}</p>}
      </div>
    </Panel>
  );
}
