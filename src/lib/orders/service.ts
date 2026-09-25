import 'server-only';
import { randomUUID } from 'node:crypto';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { ApiError, rpcErrorCode } from '@/lib/api/response';
import { RECEIPT_BUCKET } from '@/lib/env';
import { notify } from '@/lib/notifications';
import { getSiteSettings } from '@/lib/settings/queries';
import { discountedPrice } from '@/lib/products/variants';
import { validateUpload } from '@/lib/storage/validate';
import type { CheckoutInput } from '@/lib/validation/checkout';
import type { CustomerOrderView, FulfillmentStatus, PaymentStatus } from '@/types';
import type { VariantRecord } from './lines';
import { prepareOrder } from './prepare';
import { hashToken, isPlausibleToken } from './token';

type VariantRow = {
  id: string; product_id: string; sku: string; price: number | string | null; stock_quantity: number; reserved_quantity: number; is_active: boolean;
  product: { name: string; base_price: number | string; status: string; discount_enabled: boolean; discount_type: 'fixed' | 'percentage'; discount_value: number | string } | null;
  colour: { name: string } | null;
  size: { name: string } | null;
};

/** Reads authoritative prices and stock for the requested variants. */
async function loadVariantRecords(variantIds: string[]): Promise<VariantRecord[]> {
  const { data, error } = await createSupabaseAdminClient()
    .from('product_variants')
    .select('id, product_id, sku, price, stock_quantity, reserved_quantity, is_active, product:products(name, base_price, status, discount_enabled, discount_type, discount_value), colour:colours(name), size:sizes(name)')
    .in('id', variantIds);
  if (error) throw error;
  return ((data ?? []) as unknown as VariantRow[]).flatMap((row) =>
    row.product && row.colour && row.size
      ? [{
          id: row.id, productId: row.product_id, productName: row.product.name, colourName: row.colour.name, sizeName: row.size.name, sku: row.sku,
          unitPrice: discountedPrice(Number(row.price ?? row.product.base_price), { enabled: row.product.discount_enabled, type: row.product.discount_type, value: Number(row.product.discount_value) }),
          stockQuantity: row.stock_quantity, reservedQuantity: row.reserved_quantity,
          isActive: row.is_active, productPublished: row.product.status === 'published',
        }]
      : [],
  );
}

export type CreatedOrder = { orderNumber: string; token: string; subtotal: number; shippingFee: number; total: number };

const PROBLEM_TEXT = {
  VARIANT_NOT_FOUND: 'is no longer available',
  VARIANT_UNAVAILABLE: 'is no longer available',
  INSUFFICIENT_STOCK: 'does not have enough stock',
} as const;

/**
 * Creates a guest order. Prices, stock and shipping are decided here from the database; the browser supplies only
 * variant ids, quantities and contact details. The database function then re-checks everything atomically under row locks.
 */
export async function createOrder(input: CheckoutInput): Promise<CreatedOrder> {
  const admin = createSupabaseAdminClient();
  const ids = [...new Set(input.items.map((item) => item.variantId))];
  const [records, settings] = await Promise.all([loadVariantRecords(ids), getSiteSettings()]);

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const prepared = prepareOrder({ input, records, rates: settings.shippingRates });
    if (!prepared.ok) {
      const names = new Map(records.map((r) => [r.id, `${r.productName} (${r.colourName}, ${r.sizeName})`]));
      const messages = prepared.problems.map((p) => `${names.get(p.variantId) ?? 'An item'} ${PROBLEM_TEXT[p.code]}${p.available !== undefined ? ` (${p.available} left)` : ''}.`);
      throw new ApiError(409, 'items_unavailable', `Some items in your bag cannot be ordered: ${messages.join(' ')}`, prepared.problems);
    }

    const { error } = await admin.rpc('create_order', {
      p_order_number: prepared.orderNumber,
      p_token_hash: prepared.tokenHash,
      p_email: input.customer.email,
      p_full_name: input.customer.fullName,
      p_phone: input.customer.phone,
      p_address: input.delivery.address,
      p_city: input.delivery.city,
      p_state: input.delivery.state,
      p_instructions: input.delivery.instructions ?? '',
      p_items: prepared.lines.map((line) => ({ variant_id: line.variantId, quantity: line.quantity })),
      p_shipping_fee: prepared.totals.shippingFee,
      p_expected_subtotal: prepared.totals.subtotal,
    });

    if (!error) {
      await notify({ type: 'order_received', orderNumber: prepared.orderNumber });
      return { orderNumber: prepared.orderNumber, token: prepared.token, ...prepared.totals };
    }

    if (error.code === '23505' && /order_number/.test(`${error.message} ${error.details ?? ''}`)) continue; // number clash: try another
    const code = rpcErrorCode(error);
    if (code === 'INSUFFICIENT_STOCK' || code === 'VARIANT_UNAVAILABLE' || code === 'VARIANT_NOT_FOUND') {
      throw new ApiError(409, 'items_unavailable', 'Someone else just bought one of these pieces. Please review your bag and try again.');
    }
    if (code === 'PRICE_CHANGED') throw new ApiError(409, 'price_changed', 'A price changed while you were checking out. Please review your bag and try again.');
    throw error;
  }
  throw new ApiError(503, 'try_again', 'We could not place your order just now. Please try again.');
}

export type { CustomerOrderView } from '@/types';

const ORDER_VIEW_SELECT =
  'id, order_number, payment_status, fulfillment_status, subtotal, shipping_fee, total, created_at, ' +
  'address:addresses(city, state), customer:customers(email), ' +
  'payment:payments(receipt_path, rejection_reason), ' +
  'items:order_items(product_name, colour_name, size_name, quantity, line_total)';

type ViewRow = {
  id: string; order_number: string; payment_status: PaymentStatus; fulfillment_status: FulfillmentStatus;
  subtotal: number | string; shipping_fee: number | string; total: number | string; created_at: string;
  address: { city: string; state: string } | null; customer: { email: string } | null;
  payment: { receipt_path: string | null; rejection_reason: string | null } | null;
  items: { product_name: string; colour_name: string; size_name: string; quantity: number; line_total: number | string }[];
};

const toView = (row: ViewRow): CustomerOrderView => ({
  orderNumber: row.order_number, paymentStatus: row.payment_status, fulfillmentStatus: row.fulfillment_status,
  subtotal: Number(row.subtotal), shippingFee: Number(row.shipping_fee), total: Number(row.total), createdAt: row.created_at,
  deliveryCity: row.address?.city ?? null, deliveryState: row.address?.state ?? null,
  rejectionReason: row.payment?.rejection_reason ?? null, hasReceipt: Boolean(row.payment?.receipt_path),
  items: row.items.map((i) => ({ productName: i.product_name, colourName: i.colour_name, sizeName: i.size_name, quantity: i.quantity, lineTotal: Number(i.line_total) })),
});

/** Order for someone holding the secret link. Returns null for a wrong number or token, with no hint which was wrong. */
export async function getOrderByToken(orderNumber: string, token: string): Promise<CustomerOrderView | null> {
  if (!isPlausibleToken(token)) return null;
  const { data, error } = await createSupabaseAdminClient()
    .from('orders').select(ORDER_VIEW_SELECT).eq('order_number', orderNumber).eq('access_token_hash', hashToken(token)).maybeSingle();
  if (error) throw error;
  return data ? toView(data as unknown as ViewRow) : null;
}

/** Order status for someone who knows the order number and the email used at checkout. */
export async function lookupOrder(orderNumber: string, email: string): Promise<CustomerOrderView | null> {
  const { data, error } = await createSupabaseAdminClient().from('orders').select(ORDER_VIEW_SELECT).eq('order_number', orderNumber).maybeSingle();
  if (error) throw error;
  const row = data as unknown as ViewRow | null;
  if (!row || row.customer?.email !== email.toLowerCase()) return null;
  return toView(row);
}

/**
 * Customer says "I have made the payment", optionally with a receipt. This only moves the payment to SUBMITTED for
 * an admin to review. Nothing here can mark an order as paid.
 */
export async function submitPayment(args: { orderNumber: string; token: string; note?: string; file?: { bytes: Uint8Array; type: string } }): Promise<void> {
  if (!isPlausibleToken(args.token)) throw new ApiError(404, 'order_not_found', 'We could not find that order.');
  const admin = createSupabaseAdminClient();
  const tokenHash = hashToken(args.token);

  const { data: order, error: lookupError } = await admin.from('orders').select('id').eq('order_number', args.orderNumber).eq('access_token_hash', tokenHash).maybeSingle();
  if (lookupError) throw lookupError;
  if (!order) throw new ApiError(404, 'order_not_found', 'We could not find that order.');

  let receiptPath: string | null = null;
  if (args.file) {
    const check = validateUpload(args.file.bytes, 'receipt', args.file.type);
    if (!check.ok) throw new ApiError(422, 'invalid_file', check.error);
    receiptPath = `orders/${order.id}/receipts/${randomUUID()}.${check.extension}`;
    const upload = await admin.storage.from(RECEIPT_BUCKET).upload(receiptPath, args.file.bytes, { contentType: check.mime, upsert: false });
    if (upload.error) throw new ApiError(502, 'upload_failed', 'We could not save your receipt. Please try again.');
  }

  const { error } = await admin.rpc('submit_payment', {
    p_order_number: args.orderNumber, p_token_hash: tokenHash, p_receipt_path: receiptPath, p_note: args.note ?? '',
  });
  if (error) {
    if (receiptPath) await admin.storage.from(RECEIPT_BUCKET).remove([receiptPath]);
    throw error;
  }
  await notify({ type: 'payment_submitted', orderNumber: args.orderNumber });
}
