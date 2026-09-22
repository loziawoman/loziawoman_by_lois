import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PRODUCT_IMAGE_BUCKET } from '@/lib/env';
import { unwrap } from '@/lib/api/response';

/** Makes a product's offered colours and sizes match the given id lists (undefined = leave as is). */
export async function syncProductRelations(supabase: SupabaseClient, productId: string, colourIds?: string[], sizeIds?: string[]) {
  if (colourIds) {
    const existing = unwrap(await supabase.from('product_colours').select('colour_id').eq('product_id', productId)) as { colour_id: string }[];
    const stale = existing.map((r) => r.colour_id).filter((id) => !colourIds.includes(id));
    if (stale.length) unwrap(await supabase.from('product_colours').delete().eq('product_id', productId).in('colour_id', stale));
    if (colourIds.length) {
      unwrap(await supabase.from('product_colours').upsert(colourIds.map((colour_id, index) => ({ product_id: productId, colour_id, sort_order: index })), { onConflict: 'product_id,colour_id' }));
    }
  }
  if (sizeIds) {
    const existing = unwrap(await supabase.from('product_sizes').select('size_id').eq('product_id', productId)) as { size_id: string }[];
    const stale = existing.map((r) => r.size_id).filter((id) => !sizeIds.includes(id));
    if (stale.length) unwrap(await supabase.from('product_sizes').delete().eq('product_id', productId).in('size_id', stale));
    if (sizeIds.length) {
      unwrap(await supabase.from('product_sizes').upsert(sizeIds.map((size_id, index) => ({ product_id: productId, size_id, sort_order: index })), { onConflict: 'product_id,size_id' }));
    }
  }
}

/** Best-effort removal of everything stored for a product (images and masks). */
export async function removeProductFiles(supabase: SupabaseClient, productId: string) {
  const bucket = supabase.storage.from(PRODUCT_IMAGE_BUCKET);
  for (const folder of ['images', 'masks']) {
    const { data } = await bucket.list(`products/${productId}/${folder}`);
    if (data?.length) await bucket.remove(data.map((file) => `products/${productId}/${folder}/${file.name}`));
  }
}
