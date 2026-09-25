import { adminRoute } from '@/lib/api/admin-route';
import { fail, ok, parseJson, unwrap } from '@/lib/api/response';
import { logAudit } from '@/lib/audit/log';
import { removeProductFiles, syncProductRelations } from '@/lib/products/admin';
import { uuid } from '@/lib/validation/common';
import { productPatchSchema } from '@/lib/validation/admin';

type Params = { id: string };

export const PATCH = adminRoute<Params>('catalog:write', async ({ request, user, supabase, params }) => {
  const id = uuid.parse(params.id);
  const input = await parseJson(request, productPatchSchema);
  const update: Record<string, unknown> = {};
  if (input.name !== undefined) update.name = input.name;
  if (input.slug !== undefined) update.slug = input.slug;
  if (input.description !== undefined) update.description = input.description;
  if (input.shortDescription !== undefined) update.short_description = input.shortDescription;
  if (input.fabric !== undefined) update.fabric = input.fabric;
  if (input.care !== undefined) update.care = input.care;
  if (input.categoryId !== undefined) update.category_id = input.categoryId;
  if (input.basePrice !== undefined) update.base_price = input.basePrice;
  if (input.discountEnabled !== undefined) update.discount_enabled = input.discountEnabled;
  if (input.discountType !== undefined) update.discount_type = input.discountType;
  if (input.discountValue !== undefined) update.discount_value = input.discountValue;
  if (input.status !== undefined) update.status = input.status;
  if (input.featured !== undefined) update.featured = input.featured;
  if (input.originalColourId !== undefined) update.original_colour_id = input.originalColourId;

  if (Object.keys(update).length > 0) {
    const rows = unwrap(await supabase.from('products').update(update).eq('id', id).select('id'));
    if (!rows || rows.length === 0) return fail(404, 'not_found', 'That piece could not be found.');
  }
  if (input.colourIds !== undefined || input.sizeIds !== undefined) await syncProductRelations(supabase, id, input.colourIds, input.sizeIds);
  await logAudit(supabase, user, 'product.updated', 'product', id, { fields: Object.keys(input) });
  return ok({ id });
});

/** Pieces that appear on past orders are archived (so history stays intact); others are deleted with their files. */
export const DELETE = adminRoute<Params>('catalog:write', async ({ user, supabase, params }) => {
  const id = uuid.parse(params.id);
  const { count, error } = await supabase.from('order_items').select('id', { count: 'exact', head: true }).eq('product_id', id);
  if (error) throw error;

  if ((count ?? 0) > 0) {
    unwrap(await supabase.from('products').update({ status: 'archived', featured: false }).eq('id', id).select('id'));
    await logAudit(supabase, user, 'product.archived', 'product', id, { reason: 'has orders' });
    return ok({ id, archived: true });
  }
  await removeProductFiles(supabase, id);
  const rows = unwrap(await supabase.from('products').delete().eq('id', id).select('id'));
  if (!rows || rows.length === 0) return fail(404, 'not_found', 'That piece could not be found.');
  await logAudit(supabase, user, 'product.deleted', 'product', id);
  return ok({ id, archived: false });
});
