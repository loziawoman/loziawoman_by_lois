import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Order, PaymentStatus, FulfillmentStatus } from '@/types';
import { RECEIPT_BUCKET } from '@/lib/env';

const ORDER_SELECT =
  'id, order_number, payment_status, fulfillment_status, subtotal, shipping_fee, total, currency, admin_notes, cancelled_reason, created_at, ' +
  'customer:customers(id, email, full_name, phone, created_at), ' +
  'address:addresses(id, full_name, phone, address_line, city, state, instructions), ' +
  'items:order_items(id, variant_id, product_id, product_name, colour_name, size_name, sku, unit_price, quantity, line_total), ' +
  'payment:payments(status, amount, method, receipt_path, customer_note, submitted_at, reviewed_at, rejection_reason), ' +
  'shipping:shipments(carrier, tracking_number, shipped_at, delivered_at)';

/* eslint-disable @typescript-eslint/no-explicit-any */
const one = <T,>(value: T | T[] | null | undefined): T | null => (Array.isArray(value) ? (value[0] ?? null) : (value ?? null));

function mapOrder(row: any): Order {
  const customer = one<any>(row.customer);
  const address = one<any>(row.address);
  const payment = one<any>(row.payment);
  const shipping = one<any>(row.shipping);
  return {
    id: row.id, orderNumber: row.order_number, paymentStatus: row.payment_status, fulfillmentStatus: row.fulfillment_status,
    subtotal: Number(row.subtotal), shippingFee: Number(row.shipping_fee), total: Number(row.total), currency: row.currency,
    adminNotes: row.admin_notes, cancelledReason: row.cancelled_reason, createdAt: row.created_at,
    customer: customer ? { id: customer.id, email: customer.email, fullName: customer.full_name, phone: customer.phone, createdAt: customer.created_at } : null,
    address: address ? { id: address.id, fullName: address.full_name, phone: address.phone, addressLine: address.address_line, city: address.city, state: address.state, instructions: address.instructions } : null,
    items: (row.items ?? []).map((i: any) => ({
      id: i.id, variantId: i.variant_id, productId: i.product_id, productName: i.product_name, colourName: i.colour_name, sizeName: i.size_name,
      sku: i.sku, unitPrice: Number(i.unit_price), quantity: i.quantity, lineTotal: Number(i.line_total),
    })),
    payment: payment ? {
      status: payment.status, amount: Number(payment.amount), method: payment.method, receiptPath: payment.receipt_path,
      customerNote: payment.customer_note, submittedAt: payment.submitted_at, reviewedAt: payment.reviewed_at, rejectionReason: payment.rejection_reason,
    } : null,
    shipping: shipping ? { carrier: shipping.carrier, trackingNumber: shipping.tracking_number, shippedAt: shipping.shipped_at, deliveredAt: shipping.delivered_at } : null,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export type OrderListFilters = { payment?: PaymentStatus; fulfillment?: FulfillmentStatus; q?: string; customerId?: string };

/** Strips characters that have meaning in PostgREST filter syntax. */
const safeTerm = (value: string) => value.replace(/[^\p{L}\p{N}\s@.\-_]/gu, '').trim().slice(0, 60);

export async function listOrders(supabase: SupabaseClient, filters: OrderListFilters = {}, limit = 50): Promise<Order[]> {
  let query = supabase.from('orders').select(ORDER_SELECT).order('created_at', { ascending: false }).limit(limit);
  if (filters.payment) query = query.eq('payment_status', filters.payment);
  if (filters.fulfillment) query = query.eq('fulfillment_status', filters.fulfillment);
  if (filters.customerId) query = query.eq('customer_id', filters.customerId);

  const term = filters.q ? safeTerm(filters.q) : '';
  if (term) {
    const { data: matches } = await supabase.from('customers').select('id').or(`full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`).limit(50);
    const ids = (matches ?? []).map((c: { id: string }) => c.id);
    query = query.or([`order_number.ilike.%${term}%`, ...(ids.length ? [`customer_id.in.(${ids.join(',')})`] : [])].join(','));
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapOrder);
}

export async function getOrder(supabase: SupabaseClient, id: string): Promise<Order | null> {
  const { data, error } = await supabase.from('orders').select(ORDER_SELECT).eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapOrder(data) : null;
}

/** Short-lived link to a private receipt. Staff only: the storage policy checks the caller's role. */
export async function receiptUrl(supabase: SupabaseClient, path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(RECEIPT_BUCKET).createSignedUrl(path, 300);
  if (error) return null;
  return data.signedUrl;
}
