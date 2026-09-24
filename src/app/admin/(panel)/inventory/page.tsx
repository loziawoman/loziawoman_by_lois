import type { Metadata } from 'next';
import Link from 'next/link';
import { StockAdjuster } from '@/components/admin/stock-adjuster';
import { Empty, Pill, PageHeader, cellCls, Table } from '@/components/admin/ui';
import { loadInventory } from '@/lib/admin/queries';
import { requirePermission } from '@/lib/auth/session';
import { LOW_STOCK_THRESHOLD, stockStatus } from '@/lib/inventory/stock';

export const metadata: Metadata = { title: 'Inventory' };

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { supabase } = await requirePermission('inventory:write');
  const { filter } = await searchParams;
  const active = filter === 'low' || filter === 'out' ? filter : 'all';
  const rows = await loadInventory(supabase, active);
  const tab = (key: 'all' | 'low' | 'out', label: string) => (
    <Link href={key === 'all' ? '/admin/inventory' : `/admin/inventory?filter=${key}`} aria-current={active === key ? 'page' : undefined}
      className={`inline-flex min-h-10 items-center border px-4 text-xs uppercase tracking-[.12em] ${active === key ? 'border-[hsl(var(--primary))] bg-[hsl(var(--muted-foreground))] text-[hsl(var(--primary-foreground))]' : 'border-[hsl(var(--border))]'}`}>{label}</Link>
  );

  return (
    <>
      <PageHeader title="Inventory" description={`Stock can never go below zero or below units customers have reserved. Low stock means ${LOW_STOCK_THRESHOLD} or fewer available.`} />
      <div className="mb-6 flex flex-wrap gap-2">{tab('all', 'All variants')}{tab('low', 'Low stock')}{tab('out', 'Out of stock')}</div>
      {rows.length === 0 ? <Empty>Nothing to show here.</Empty> : (
        <Table head={['Product', 'Colour / size', 'SKU', 'Stock', 'Reserved', 'Available', 'Status']}>
          {rows.map((r) => {
            const status = stockStatus(r.available);
            return (
              <tr key={r.id}>
                <td className={cellCls}><Link className="underline-link" href={`/admin/products/${r.productId}`}>{r.productName}</Link></td>
                <td className={cellCls}>{r.colour} / {r.size}{!r.isActive && <> <Pill>Inactive</Pill></>}</td>
                <td className={cellCls}>{r.sku}</td>
                <td className={cellCls}><StockAdjuster variantId={r.id} stock={r.stock} reserved={r.reserved} /></td>
                <td className={cellCls}>{r.reserved}</td>
                <td className={cellCls}>{r.available}</td>
                <td className={cellCls}><Pill tone={status.kind === 'out' ? 'bad' : status.kind === 'low' ? 'warn' : 'good'}>{status.label}</Pill></td>
              </tr>
            );
          })}
        </Table>
      )}
    </>
  );
}
