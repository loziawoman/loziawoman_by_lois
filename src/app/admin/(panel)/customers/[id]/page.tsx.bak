import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Empty, Pill, PageHeader, Panel, cellCls, fulfillmentTone, paymentTone, Table } from '@/components/admin/ui';
import { loadCustomer } from '@/lib/admin/queries';
import { requirePermission } from '@/lib/auth/session';
import { DeleteRecordButton } from '@/components/admin/delete-record-button';
import { formatDateTime, naira } from '@/lib/format';
import { listOrders } from '@/lib/orders/admin-queries';
import { uuid } from '@/lib/validation/common';

export const metadata: Metadata = { title: 'Customer' };

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requirePermission('customers:read');
  const parsed = uuid.safeParse((await params).id);
  if (!parsed.success) notFound();
  const customer = await loadCustomer(supabase, parsed.data);
  if (!customer) notFound();
  const orders = await listOrders(supabase, { customerId: customer.id }, 100);

  return (
    <>
      <PageHeader title={customer.fullName} actions={<Link href="/admin/customers" className="underline-link mono">All customers</Link>} />
      <div className="mb-6"><DeleteRecordButton endpoint={`/api/admin/customers/${id}`} redirectTo="/admin/customers" confirmText="Delete this customer and all of their orders? This cannot be undone." /></div>
      <Panel title="Contact"><p className="text-sm">{customer.email}<br />{customer.phone}</p></Panel>
      <Panel title="Order history">
        {orders.length === 0 ? <Empty>No orders.</Empty> : (
          <Table head={['Order', 'Total', 'Payment', 'Fulfilment', 'Placed']}>
            {orders.map((o) => (
              <tr key={o.id}>
                <td className={cellCls}><Link className="underline-link" href={`/admin/orders/${o.id}`}>{o.orderNumber}</Link></td>
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
