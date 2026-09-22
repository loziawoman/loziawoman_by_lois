'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, jsonBody } from '@/lib/api/client';
import { checkAdjustment } from '@/lib/inventory/stock';
import { btnGhostCls, inputCls } from './ui';

const REASONS: Record<string, string> = { '-1': 'Manual decrease', '1': 'Manual increase' };

/** Quick +/- and "set to" controls. The server enforces the same rules and records who changed what. */
export function StockAdjuster({ variantId, stock, reserved }: { variantId: string; stock: number; reserved: number }) {
  const router = useRouter();
  const [value, setValue] = useState(String(stock));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => setValue(String(stock)), [stock]);

  const apply = async (delta: number, reason: string) => {
    const check = checkAdjustment({ stockQuantity: stock, reservedQuantity: reserved }, delta);
    if (!check.ok) { setError(check.reason === 'BELOW_RESERVED' ? 'Cannot go below reserved units.' : check.reason === 'NEGATIVE_STOCK' ? 'Stock cannot be negative.' : 'Nothing to change.'); return; }
    setBusy(true); setError('');
    const r = await apiRequest('/api/admin/stock', { method: 'POST', body: jsonBody({ variantId, delta, reason }) });
    setBusy(false);
    if (!r.ok) { setError(r.message); return; }
    router.refresh();
  };

  return (
    <div className="grid gap-1">
      <div className="flex items-center gap-1">
        <button type="button" className={`${btnGhostCls} !min-h-9 !px-3`} disabled={busy || stock <= reserved} onClick={() => apply(-1, REASONS['-1'])} aria-label="Decrease stock by one">−</button>
        <input aria-label="Stock quantity" type="number" min={0} value={value} onChange={(e) => setValue(e.target.value)} className={`${inputCls} !min-h-9 w-20`}
          onBlur={() => { const next = Number(value); if (Number.isInteger(next) && next !== stock) void apply(next - stock, 'Stock count set'); else setValue(String(stock)); }} />
        <button type="button" className={`${btnGhostCls} !min-h-9 !px-3`} disabled={busy} onClick={() => apply(1, REASONS['1'])} aria-label="Increase stock by one">+</button>
      </div>
      {error && <span role="alert" className="text-xs text-[hsl(var(--destructive))]">{error}</span>}
    </div>
  );
}
