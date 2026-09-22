'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, jsonBody } from '@/lib/api/client';
import { stockStatus } from '@/lib/inventory/stock';
import type { Product } from '@/types';
import { Pill, btnCls, cellCls, inputCls, Table } from './ui';
import { StockAdjuster } from './stock-adjuster';

type Option = { id: string; name: string };

export function VariantManager({ product, colours, sizes, readOnly, canAdjustStock }: { product: Product; colours: Option[]; sizes: Option[]; readOnly: boolean; canAdjustStock: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const colourName = (id: string) => colours.find((c) => c.id === id)?.name ?? '?';
  const sizeName = (id: string) => sizes.find((s) => s.id === id)?.name ?? '?';

  const run = async (url: string, method: string, body?: unknown) => {
    setBusy(true); setMessage('');
    const r = await apiRequest(url, { method, body: body === undefined ? undefined : jsonBody(body) });
    setBusy(false);
    if (!r.ok) { setMessage(r.message); return false; }
    router.refresh();
    return true;
  };

  return (
    <div>
      <p className="mb-4 text-sm text-[hsl(var(--muted-foreground))]">Each colour and size combination is its own variant with its own SKU, price and stock. Leave a price empty to use the base price.</p>
      {!readOnly && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <button type="button" disabled={busy} className={btnCls} onClick={() => run('/api/admin/variants/generate', 'POST', { productId: product.id })} data-testid="button-generate-variants">Create missing variants</button>
          <span className="text-xs text-[hsl(var(--muted-foreground))]">Adds every colour × size combination you have ticked above, at zero stock.</span>
        </div>
      )}
      {product.variants.length === 0 ? <p className="text-sm">No variants yet. Tick colours and sizes above, save, then create the variants.</p> : (
        <Table head={['Colour / size', 'SKU', 'Price (₦)', 'Stock', 'Reserved', 'Status', 'Active']}>
          {product.variants.map((v) => {
            const status = stockStatus(v.available);
            return (
              <tr key={v.id}>
                <td className={cellCls}>{colourName(v.colourId)} / {sizeName(v.sizeId)}</td>
                <td className={cellCls}><input aria-label={`SKU for ${colourName(v.colourId)} ${sizeName(v.sizeId)}`} defaultValue={v.sku} disabled={readOnly} className={`${inputCls} min-w-[140px]`} onBlur={(e) => e.target.value !== v.sku && run(`/api/admin/variants/${v.id}`, 'PATCH', { sku: e.target.value })} /></td>
                <td className={cellCls}><input aria-label="Price override" type="number" min={0} step="0.01" placeholder={String(product.basePrice)} defaultValue={v.price === product.basePrice ? '' : v.price} disabled={readOnly} className={`${inputCls} w-28`}
                  onBlur={(e) => { const value = e.target.value === '' ? null : Number(e.target.value); if (value !== (v.price === product.basePrice ? null : v.price)) run(`/api/admin/variants/${v.id}`, 'PATCH', { price: value }); }} /></td>
                <td className={cellCls}>{canAdjustStock ? <StockAdjuster variantId={v.id} stock={v.stockQuantity} reserved={v.reservedQuantity} /> : v.stockQuantity}</td>
                <td className={cellCls}>{v.reservedQuantity}</td>
                <td className={cellCls}><Pill tone={status.kind === 'out' ? 'bad' : status.kind === 'low' ? 'warn' : 'good'}>{status.label}</Pill></td>
                <td className={cellCls}><input type="checkbox" aria-label="Variant active" defaultChecked={v.isActive} disabled={readOnly} className="h-5 w-5" onChange={(e) => run(`/api/admin/variants/${v.id}`, 'PATCH', { isActive: e.target.checked })} /></td>
              </tr>
            );
          })}
        </Table>
      )}
      {message && <p role="alert" className="mt-3 text-sm text-[hsl(var(--destructive))]">{message}</p>}
    </div>
  );
}
