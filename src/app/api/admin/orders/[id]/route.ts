import { adminRoute } from '@/lib/api/admin-route';
import { fail, ok, parseJson, unwrap } from '@/lib/api/response';
import { can } from '@/lib/auth/permissions';
import { notify } from '@/lib/notifications';
import { orderActionSchema } from '@/lib/validation/admin';
import { RECEIPT_BUCKET } from '@/lib/env';
import { uuid } from '@/lib/validation/common';

/**
 * Every order action goes through a SQL function that re-checks the caller's role and the order's state,
 * changes stock where needed, and writes the audit entry. Sensitive actions need the payments:verify permission.
 */
export const POST = adminRoute<{ id: string }>('orders:write', async ({ request, user, supabase, params }) => {
  const id = uuid.parse(params.id);
  const input = await parseJson(request, orderActionSchema);
  const sensitive = ['verify_payment', 'reject_payment', 'cancel', 'refund'];
  if (sensitive.includes(input.action) && !can(user.role, 'payments:verify')) return fail(403, 'forbidden', 'You do not have permission to do that.');

  const order = unwrap(await supabase.from('orders').select('order_number').eq('id', id).maybeSingle()) as { order_number: string } | null;
  if (!order) return fail(404, 'not_found', 'Order not found.');
  const orderNumber = order.order_number;

  switch (input.action) {
    case 'verify_payment':
      unwrap(await supabase.rpc('verify_payment', { p_order_id: id }));
      await notify({ type: 'payment_verified', orderNumber });
      await notify({ type: 'order_processing', orderNumber });
      break;
    case 'reject_payment':
      unwrap(await supabase.rpc('reject_payment', { p_order_id: id, p_reason: input.reason }));
      await notify({ type: 'payment_rejected', orderNumber, reason: input.reason });
      break;
    case 'mark_shipped':
      unwrap(await supabase.rpc('set_fulfillment_status', { p_order_id: id, p_status: 'SHIPPED', p_carrier: input.carrier ?? '', p_tracking: input.tracking ?? '' }));
      await notify({ type: 'order_shipped', orderNumber, tracking: input.tracking });
      break;
    case 'mark_delivered':
      unwrap(await supabase.rpc('set_fulfillment_status', { p_order_id: id, p_status: 'DELIVERED', p_carrier: '', p_tracking: '' }));
      await notify({ type: 'order_delivered', orderNumber });
      break;
    case 'cancel':
      unwrap(await supabase.rpc('cancel_order', { p_order_id: id, p_reason: input.reason }));
      break;
    case 'refund':
      unwrap(await supabase.rpc('mark_refunded', { p_order_id: id }));
      break;
    case 'add_note':
      unwrap(await supabase.rpc('add_order_note', { p_order_id: id, p_note: input.note }));
      break;
  }
  return ok({ id, action: input.action });
});

export const DELETE = adminRoute<{ id: string }>('orders:delete', async ({ supabase, params }) => {
  const id = uuid.parse(params.id);
  const result = unwrap(
    await supabase.rpc('delete_order_for_admin', { p_order_id: id })
  ) as { order_number?: string; receipt_paths?: string[] } | null;

  const paths = result?.receipt_paths ?? [];
  if (paths.length) {
    await supabase.storage.from(RECEIPT_BUCKET).remove(paths);
  }

  return ok({ id, deleted: true, orderNumber: result?.order_number ?? null });
});
