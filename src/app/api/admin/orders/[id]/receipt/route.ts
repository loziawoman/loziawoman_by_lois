import { adminRoute } from '@/lib/api/admin-route';
import { fail, ok, unwrap } from '@/lib/api/response';
import { receiptUrl } from '@/lib/orders/admin-queries';
import { uuid } from '@/lib/validation/common';

/** Returns a five-minute signed link to the uploaded receipt. Receipts are never publicly readable. */
export const GET = adminRoute<{ id: string }>('orders:read', async ({ supabase, params }) => {
  const id = uuid.parse(params.id);
  const payment = unwrap(await supabase.from('payments').select('receipt_path').eq('order_id', id).maybeSingle()) as { receipt_path: string | null } | null;
  if (!payment?.receipt_path) return fail(404, 'no_receipt', 'No receipt was uploaded for this order.');
  const url = await receiptUrl(supabase, payment.receipt_path);
  if (!url) return fail(502, 'receipt_unavailable', 'The receipt could not be opened.');
  return ok({ url });
});
