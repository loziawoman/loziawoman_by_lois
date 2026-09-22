import { adminRoute } from '@/lib/api/admin-route';
import { ok, parseJson, unwrap } from '@/lib/api/response';
import { logAudit } from '@/lib/audit/log';
import { variantInputSchema } from '@/lib/validation/admin';

export const POST = adminRoute('catalog:write', async ({ request, user, supabase }) => {
  const input = await parseJson(request, variantInputSchema);
  const row = unwrap(await supabase.from('product_variants').insert({
    product_id: input.productId, colour_id: input.colourId, size_id: input.sizeId, sku: input.sku,
    price: input.price, stock_quantity: input.stockQuantity, is_active: input.isActive,
  }).select('id').single());
  await logAudit(supabase, user, 'variant.created', 'variant', row.id, { sku: input.sku });
  return ok({ id: row.id }, 201);
});
