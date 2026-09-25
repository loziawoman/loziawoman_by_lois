import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { OrderActions } from '@/components/admin/order-actions';
import { Pill, PageHeader, Panel, cellCls, fulfillmentTone, paymentTone, Table } from '@/components/admin/ui';
import { can } from '@/lib/auth/permissions';
import { requirePermission } from '@/lib/auth/session';
import { DeleteRecordButton } from '@/components/admin/delete-record-button';
import { formatDateTime, naira } from '@/lib/format';
import { getOrder } from '@/lib/orders/admin-queries';
import { availableActions } from '@/lib/orders/status';
import { uuid } from '@/lib/validation/common';

export const metadata: Metadata = { title: 'Order' };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, supabase } = await requirePermission('orders:read');
  const parsed = uuid.safeParse((await params).id);
  if (!parsed.success) notFound();
  const order = await getOrder(supabase, parsed.data);
  if (!order) notFound();

  const actions = availableActions({ payment: order.paymentStatus, fulfillment: order.fulfillmentStatus })
    .filter((a) => !['verify_payment', 'reject_payment', 'cancel', 'refund'].includes(a) || can(user.role, 'payments:verify'));

  return (
    <>
      <PageHeader title={order.orderNumber} description={`Placed ${formatDateTime(order.createdAt)}`} actions={<Link href="/admin/orders" className="underline-link mono">All orders</Link>} />
      <div className="mb-6"><DeleteRecordButton endpoint={`/api/admin/orders/${parsed.data}`} redirectTo="/admin/orders" confirmText="Delete this order permanently? This cannot be undone." /></div>
      <div className="mb-8 flex flex-wrap gap-2">
        <Pill tone={paymentTone(order.paymentStatus)}>Payment: {order.paymentStatus}</Pill>
        <Pill tone={fulfillmentTone(order.fulfillmentStatus)}>Fulfilment: {order.fulfillmentStatus}</Pill>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <Panel title="Items">
            <Table head={['Item', 'SKU', 'Price', 'Qty', 'Line']}>
              {order.items.map((i) => (
                <tr key={i.id}>
                  <td className={cellCls}>{i.productName}<br /><span className="text-xs text-[hsl(var(--muted-foreground))]">{i.colourName} · {i.sizeName}</span></td>
                  <td className={cellCls}>{i.sku}</td><td className={cellCls}>{naira(i.unitPrice)}</td><td className={cellCls}>{i.quantity}</td><td className={cellCls}>{naira(i.lineTotal)}</td>
                </tr>
              ))}
            </Table>
            <dl className="mt-4 grid max-w-[280px] gap-1 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{naira(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt>Delivery</dt><dd>{naira(order.shippingFee)}</dd></div>
              <div className="flex justify-between border-t border-[hsl(var(--border))] pt-2 text-base"><dt>Total</dt><dd>{naira(order.total)}</dd></div>
            </dl>
          </Panel>

          <Panel title="Payment">
            {order.payment ? (
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div><dt className="mono text-[hsl(var(--muted-foreground))]">Amount due</dt><dd>{naira(order.payment.amount)}</dd></div>
                <div><dt className="mono text-[hsl(var(--muted-foreground))]">Method</dt><dd>Bank transfer</dd></div>
                <div><dt className="mono text-[hsl(var(--muted-foreground))]">Submitted</dt><dd>{order.payment.submittedAt ? formatDateTime(order.payment.submittedAt) : 'Not yet'}</dd></div>
                <div><dt className="mono text-[hsl(var(--muted-foreground))]">Reviewed</dt><dd>{order.payment.reviewedAt ? formatDateTime(order.payment.reviewedAt) : 'Not yet'}</dd></div>
                {order.payment.customerNote && <div className="sm:col-span-2"><dt className="mono text-[hsl(var(--muted-foreground))]">Customer note</dt><dd>{order.payment.customerNote}</dd></div>}
                {order.payment.rejectionReason && <div className="sm:col-span-2"><dt className="mono text-[hsl(var(--muted-foreground))]">Rejection reason</dt><dd>{order.payment.rejectionReason}</dd></div>}
              </dl>
            ) : <p className="text-sm">No payment record.</p>}
          </Panel>

          <Panel title="Notes">
            <pre className="whitespace-pre-wrap text-sm">{order.adminNotes || 'No notes yet.'}</pre>
          </Panel>
        </div>

        <div>
          <Panel title="Customer">
            <p className="text-sm">{order.customer?.fullName}<br />{order.customer?.email}<br />{order.customer?.phone}</p>
            {order.customer && can(user.role, 'customers:read') && <Link className="underline-link mono mt-3 inline-block" href={`/admin/customers/${order.customer.id}`}>Order history</Link>}
          </Panel>
          <Panel title="Delivery">
            {order.address ? <p className="text-sm">{order.address.fullName}<br />{order.address.addressLine}<br />{order.address.city}, {order.address.state}<br />{order.address.phone}{order.address.instructions ? <><br /><em>{order.address.instructions}</em></> : null}</p> : <p className="text-sm">No address.</p>}
            {order.shipping && <p className="mt-3 text-sm">{order.shipping.carrier} {order.shipping.trackingNumber}</p>}
          </Panel>
          <OrderActions orderId={order.id} actions={actions} hasReceipt={Boolean(order.payment?.receiptPath)} />
        </div>
      </div>
    </>
  );
}
