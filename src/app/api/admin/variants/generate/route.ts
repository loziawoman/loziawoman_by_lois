import { adminRoute } from '@/lib/api/admin-route';
import { fail, ok, parseJson, unwrap } from '@/lib/api/response';
import { logAudit } from '@/lib/audit/log';
import { generateVariantsSchema } from '@/lib/validation/admin';

/** Creates any missing colour x size variants for a product, at zero stock, ready for the team to fill in. */
export const POST = adminRoute('catalog:write', async ({ request, user, supabase }) => {
  const { productId } = await parseJson(request, generateVariantsSchema);
  const product = unwrap(await supabase.from('products').select('slug').eq('id', productId).maybeSingle()) as { slug: string } | null;
  if (!product) return fail(404, 'not_found', 'That piece could not be found.');

  const colours = unwrap(await supabase.from('product_colours').select('colour:colours(id, slug)').eq('product_id', productId)) as unknown as { colour: { id: string; slug: string } | null }[];
  const sizes = unwrap(await supabase.from('product_sizes').select('size:sizes(id, name)').eq('product_id', productId)) as unknown as { size: { id: string; name: string } | null }[];
  const existing = unwrap(await supabase.from('product_variants').select('colour_id, size_id').eq('product_id', productId)) as { colour_id: string; size_id: string }[];
  const have = new Set(existing.map((v) => `${v.colour_id}:${v.size_id}`));

  const missing = colours.flatMap(({ colour }) => sizes.flatMap(({ size }) =>
    colour && size && !have.has(`${colour.id}:${size.id}`)
      ? [{ product_id: productId, colour_id: colour.id, size_id: size.id, sku: `${product.slug}-${colour.slug}-${size.name}`.toUpperCase().replace(/[^A-Z0-9-]/g, ''), stock_quantity: 0, is_active: true }]
      : [],
  ));
  if (missing.length) unwrap(await supabase.from('product_variants').insert(missing));
  await logAudit(supabase, user, 'variant.generated', 'product', productId, { created: missing.length });
  return ok({ created: missing.length });
});
