import { adminRoute } from '@/lib/api/admin-route';
import { fail, ok, parseJson, unwrap } from '@/lib/api/response';
import { logAudit } from '@/lib/audit/log';
import { variantPatchSchema } from '@/lib/validation/admin';
import { uuid } from '@/lib/validation/common';

/** Stock is not editable here. Use the stock endpoint so every change is checked and audited. */
export const PATCH = adminRoute<{ id: string }>('catalog:write', async ({ request, user, supabase, params }) => {
  const id = uuid.parse(params.id);
  const input = await parseJson(request, variantPatchSchema);
  const update: Record<string, unknown> = {};
  if (input.sku !== undefined) update.sku = input.sku;
  if (input.price !== undefined) update.price = input.price;
  if (input.isActive !== undefined) update.is_active = input.isActive;
  if (Object.keys(update).length === 0) return ok({ id });

  const rows = unwrap(await supabase.from('product_variants').update(update).eq('id', id).select('id'));
  if (!rows || rows.length === 0) return fail(404, 'not_found', 'Variant not found.');
  await logAudit(supabase, user, 'variant.updated', 'variant', id, { fields: Object.keys(input) });
  return ok({ id });
});
