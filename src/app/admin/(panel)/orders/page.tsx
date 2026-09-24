import type { Metadata } from 'next';
import Link from 'next/link';
import { Empty, Pill, PageHeader, cellCls, fulfillmentTone, inputCls, paymentTone, Table, btnCls, btnGhostCls } from '@/components/admin/ui';
import { requirePermission } from '@/lib/auth/session';
import { DeleteRecordButton } from '@/components/admin/delete-record-button';
import { formatDateTime, naira } from '@/lib/format';
import { listOrders } from '@/lib/orders/admin-queries';
import type { FulfillmentStatus, PaymentStatus } from '@/types';

export const metadata: Metadata = { title: 'Orders' };

const PAYMENT: PaymentStatus[] = ['PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED', 'REFUNDED'];
const FULFILLMENT: FulfillmentStatus[] = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const pick = <T extends string>(v: string | undefined, all: readonly T[]) => (all.includes(v as T) ? (v as T) : undefined);

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ payment?: string; fulfillment?: string; q?: string }> }) {
  const { supabase } = await requirePermission('orders:read');
  const params = await searchParams;
  const orders = await listOrders(supabase, { payment: pick(params.payment, PAYMENT), fulfillment: pick(params.fulfillment, FULFILLMENT), q: params.q });

  return (
    <>
      <PageHeader title="Orders" description="Search, filter and open an order to verify its payment or update its status." />
      <form className="mb-6 grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto_auto]" role="search">
        <input name="q" defaultValue={params.q} placeholder="Order number, name, email or phone" aria-label="Search orders" className={inputCls} />
        <select name="payment" defaultValue={params.payment ?? ''} aria-label="Payment status" className={inputCls}>
          <option value="">Any payment</option>{PAYMENT.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select name="fulfillment" defaultValue={params.fulfillment ?? ''} aria-label="Fulfilment status" className={inputCls}>
          <option value="">Any fulfilment</option>{FULFILLMENT.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className={btnCls} type="submit">Filter</button>
        <Link className={btnGhostCls} href="/admin/orders">Clear</Link>
      </form>
      {orders.length === 0 ? <Empty>No orders match.</Empty> : (
        <Table head={['Order', 'Customer', 'Total', 'Payment', 'Fulfilment', 'Placed', '']}>
          {orders.map((o) => (
            <tr key={o.id}>
              <td className={cellCls}><Link className="underline-link" href={`/admin/orders/${o.id}`}>{o.orderNumber}</Link></td>
              <td className={cellCls}>{o.customer?.fullName}<br /><span className="text-xs text-[hsl(var(--muted-foreground))]">{o.customer?.email}</span></td>
              <td className={cellCls}>{naira(o.total)}</td>
              <td className={cellCls}><Pill tone={paymentTone(o.paymentStatus)}>{o.paymentStatus}</Pill></td>
              <td className={cellCls}><Pill tone={fulfillmentTone(o.fulfillmentStatus)}>{o.fulfillmentStatus}</Pill></td>
              <td className={cellCls}>{formatDateTime(o.createdAt)}</td>
              <td className={cellCls}><DeleteRecordButton endpoint={`/api/admin/orders/${o.id}`} confirmText={`Delete order ${o.orderNumber}? This cannot be undone.`} /></td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
