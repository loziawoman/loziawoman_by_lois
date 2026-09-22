import Link from 'next/link';
import { Empty, Pill, PageHeader, Panel, cellCls, fulfillmentTone, paymentTone, Table } from '@/components/admin/ui';
import { loadDashboard } from '@/lib/admin/queries';
import { requirePermission } from '@/lib/auth/session';
import { formatDateTime, naira } from '@/lib/format';

export default async function DashboardPage() {
  const { supabase } = await requirePermission('orders:read');
  const d = await loadDashboard(supabase);
  const stats: [string, number, string][] = [
    ['Total orders', d.totalOrders, '/admin/orders'],
    ['Pending payments', d.pendingPayments, '/admin/orders?payment=SUBMITTED'],
    ['Verified payments', d.verifiedPayments, '/admin/orders?payment=VERIFIED'],
    ['Processing', d.processing, '/admin/orders?fulfillment=PROCESSING'],
    ['Shipped', d.shipped, '/admin/orders?fulfillment=SHIPPED'],
    ['Delivered', d.delivered, '/admin/orders?fulfillment=DELIVERED'],
    ['Products', d.totalProducts, '/admin/products'],
    ['Low-stock variants', d.lowStock, '/admin/inventory?filter=low'],
    ['Out-of-stock variants', d.outOfStock, '/admin/inventory?filter=out'],
  ];
  return (
    <>
      <PageHeader title="Dashboard" description="What needs attention today." />
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {stats.map(([label, value, href]) => (
          <Link key={label} href={href} className="border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 hover:border-[hsl(var(--primary))]">
            <p className="mono text-[hsl(var(--muted-foreground))]">{label}</p>
            <p className="serif mt-2 text-4xl">{value}</p>
          </Link>
        ))}
      </div>
      <Panel title="Recent orders">
        {d.recent.length === 0 ? <Empty>No orders yet.</Empty> : (
          <Table head={['Order', 'Customer', 'Total', 'Payment', 'Fulfilment', 'Placed']}>
            {d.recent.map((o) => (
              <tr key={o.id}>
                <td className={cellCls}><Link className="underline-link" href={`/admin/orders/${o.id}`}>{o.orderNumber}</Link></td>
                <td className={cellCls}>{o.customer?.fullName}</td>
                <td className={cellCls}>{naira(o.total)}</td>
                <td className={cellCls}><Pill tone={paymentTone(o.paymentStatus)}>{o.paymentStatus}</Pill></td>
                <td className={cellCls}><Pill tone={fulfillmentTone(o.fulfillmentStatus)}>{o.fulfillmentStatus}</Pill></td>
                <td className={cellCls}>{formatDateTime(o.createdAt)}</td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
    </>
  );
}
