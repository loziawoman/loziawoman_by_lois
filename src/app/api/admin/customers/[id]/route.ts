import { adminRoute } from '@/lib/api/admin-route';
import { ok, unwrap } from '@/lib/api/response';
import { RECEIPT_BUCKET } from '@/lib/env';
import { logAudit } from '@/lib/audit/log';
import { uuid } from '@/lib/validation/common';

export const DELETE = adminRoute<{ id: string }>(
  'customers:write',
  async ({ user, supabase, params }) => {
    const id = uuid.parse(params.id);

    const result = unwrap(
      await supabase.rpc('delete_customer_for_admin', {
        p_customer_id: id,
      })
    ) as {
      customer_id?: string;
      customer_name?: string;
      deleted_orders?: number;
      receipt_paths?: string[];
    } | null;

    const paths = result?.receipt_paths ?? [];

    if (paths.length) {
      await supabase.storage.from(RECEIPT_BUCKET).remove(paths);
    }

    await logAudit(supabase, user, 'customer.deleted', 'customer', id, {
      customer_name: result?.customer_name ?? null,
      deleted_orders: result?.deleted_orders ?? 0,
    });

    return ok({
      id,
      deleted: true,
      deletedOrders: result?.deleted_orders ?? 0,
    });
  }
);
