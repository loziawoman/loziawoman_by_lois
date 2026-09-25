import { adminRoute } from '@/lib/api/admin-route';
import { ok, parseJson, unwrap } from '@/lib/api/response';
import { logAudit } from '@/lib/audit/log';
import { syncProductRelations } from '@/lib/products/admin';
import { productInputSchema } from '@/lib/validation/admin';

export const POST = adminRoute('catalog:write', async ({ request, user, supabase }) => {
  const input = await parseJson(request, productInputSchema);
  const row = unwrap(await supabase.from('products').insert({
    name: input.name, slug: input.slug, description: input.description, short_description: input.shortDescription,
    fabric: input.fabric, care: input.care, category_id: input.categoryId, base_price: input.basePrice,
    discount_enabled: input.discountEnabled, discount_type: input.discountType, discount_value: input.discountValue,
    status: input.status, featured: input.featured, original_colour_id: input.originalColourId,
  }).select('id').single());
  await syncProductRelations(supabase, row.id, input.colourIds, input.sizeIds);
  await logAudit(supabase, user, 'product.created', 'product', row.id, { name: input.name });
  return ok({ id: row.id }, 201);
});
