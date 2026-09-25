import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PaymentPanel } from '@/components/checkout/payment-panel';
import { naira } from '@/lib/format';
import { isOrderNumber } from '@/lib/orders/number';
import { describeOrder } from '@/lib/orders/status';
import { getOrderByToken } from '@/lib/orders/service';
import { getBankDetails } from '@/lib/settings/queries';

// The link carries a private token: keep it out of search results and out of Referer headers.
export const metadata: Metadata = { title: 'Your order', robots: { index: false, follow: false }, referrer: 'no-referrer' };
export const dynamic = 'force-dynamic';

export default async function OrderConfirmedPage({ searchParams }: { searchParams: Promise<{ order?: string; token?: string }> }) {
  const { order: orderNumber, token } = await searchParams;
  if (!orderNumber || !token || !isOrderNumber(orderNumber)) notFound();
  const order = await getOrderByToken(orderNumber, token);
  if (!order) notFound();
  const bank = await getBankDetails();

  return (
    <main className="mx-auto max-w-[900px] px-5 py-16 md:px-10 md:py-28">
      <span className="mono text-[hsl(var(--accent))]">Order {order.orderNumber}</span>
      <h1 className="serif mt-5 text-6xl md:text-8xl">Order received.</h1>
      <p className="mt-6 max-w-[600px] text-lg leading-8 text-[hsl(var(--muted-foreground))]">
        Thank you. Your pieces are being held for you. Your order is complete once we have confirmed your bank transfer.
      </p>
      <p className="mono mt-4" data-testid="text-order-status">Status: {describeOrder({ payment: order.paymentStatus, fulfillment: order.fulfillmentStatus })}</p>

      <PaymentPanel
        orderNumber={order.orderNumber} token={token} total={order.total} bank={bank}
        paymentStatus={order.paymentStatus} fulfillmentStatus={order.fulfillmentStatus}
        rejectionReason={order.rejectionReason} hasReceipt={order.hasReceipt}
      />

      <section className="mt-14 border-t border-[hsl(var(--border))] pt-8" aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="serif text-3xl">Your order</h2>
        <ul className="mt-5 divide-y divide-[hsl(var(--border))]">
          {order.items.map((item, i) => (
            <li key={i} className="flex justify-between gap-4 py-4 text-sm">
              <span>{item.productName} <span className="text-[hsl(var(--muted-foreground))]">· {item.colourName} · {item.sizeName} · ×{item.quantity}</span></span>
              <span>{naira(item.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 grid gap-2 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{naira(order.subtotal)}</dd></div>
          <div className="flex justify-between"><dt>Delivery</dt><dd>{order.shippingFee > 0 ? naira(order.shippingFee) : 'To be confirmed'}</dd></div>
          <div className="flex justify-between border-t border-[hsl(var(--border))] pt-3 text-base"><dt>Total</dt><dd>{naira(order.total)}</dd></div>
        </dl>
        {order.deliveryCity && <p className="mt-6 text-sm text-[hsl(var(--muted-foreground))]">Delivering to {order.deliveryCity}, {order.deliveryState}.</p>}
      </section>

      <p className="mt-10 text-sm text-[hsl(var(--muted-foreground))]">
        Keep this page&apos;s link: it is how you come back to your order. You can also <Link href="/track-order" className="underline-link text-bold">track your order</Link> with your order number and email, by clicking the <Link href="/track-order" className="underline-link">track an order</Link> link in the footer.
      </p>
    </main>
  );
}
