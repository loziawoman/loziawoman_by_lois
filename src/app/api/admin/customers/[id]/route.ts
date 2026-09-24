import { adminRoute } from '@/lib/api/admin-route';
import { ok, unwrap } from '@/lib/api/response';
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
      await supabase.storage.from('receipts').remove(paths);
    }

    // Keep this audit call only when the project's audit helper exists.
    try {
      const { logAudit } = await import('@/lib/audit');
      await logAudit(supabase, user, 'customer.deleted', 'customer', id, {
        customer_name: result?.customer_name ?? null,
        deleted_orders: result?.deleted_orders ?? 0,
      });
    } catch {
      // Deletion itself has already succeeded; audit logging must not make
      // a successful deletion look like a failure.
    }

    return ok({
      id,
      deleted: true,
      deletedOrders: result?.deleted_orders ?? 0,
    });
  }
);
