import { adminRoute } from '@/lib/api/admin-route';
import { ok, parseJson, unwrap } from '@/lib/api/response';
import { stockAdjustSchema } from '@/lib/validation/admin';

/** Increase or decrease stock. The database function refuses negative stock or stock below reserved units, and audits the change. */
export const POST = adminRoute('inventory:write', async ({ request, supabase }) => {
  const input = await parseJson(request, stockAdjustSchema);
  const result = unwrap(await supabase.rpc('adjust_stock', { p_variant_id: input.variantId, p_delta: input.delta, p_reason: input.reason })) as { stock_quantity: number };
  return ok({ variantId: input.variantId, stockQuantity: result.stock_quantity });
});
