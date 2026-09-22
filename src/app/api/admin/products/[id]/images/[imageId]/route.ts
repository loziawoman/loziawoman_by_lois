import { randomUUID } from 'node:crypto';
import { adminRoute } from '@/lib/api/admin-route';
import { ApiError, fail, ok, parseJson, unwrap } from '@/lib/api/response';
import { logAudit } from '@/lib/audit/log';
import { PRODUCT_IMAGE_BUCKET } from '@/lib/env';
import { validateUpload } from '@/lib/storage/validate';
import { imagePatchSchema } from '@/lib/validation/admin';
import { uuid } from '@/lib/validation/common';

type Params = { id: string; imageId: string };

/** Edit alt text, make primary, or remove the mask. */
export const PATCH = adminRoute<Params>('catalog:write', async ({ request, user, supabase, params }) => {
  const productId = uuid.parse(params.id);
  const imageId = uuid.parse(params.imageId);
  const input = await parseJson(request, imagePatchSchema);

  if (input.altText !== undefined) unwrap(await supabase.from('product_images').update({ alt_text: input.altText }).eq('id', imageId).eq('product_id', productId).select('id'));
  if (input.clearMask) {
    const row = unwrap(await supabase.from('product_images').select('mask_storage_path').eq('id', imageId).maybeSingle()) as { mask_storage_path: string | null } | null;
    if (row?.mask_storage_path) await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove([row.mask_storage_path]);
    unwrap(await supabase.from('product_images').update({ mask_storage_path: null, mask_public_url: null }).eq('id', imageId).eq('product_id', productId).select('id'));
  }
  if (input.isPrimary) unwrap(await supabase.rpc('set_primary_image', { p_product_id: productId, p_image_id: imageId }));
  await logAudit(supabase, user, 'product.image_updated', 'product', productId, { imageId, fields: Object.keys(input) });
  return ok({ id: imageId });
});

/** Attach or replace the garment mask (multipart: mask). */
export const PUT = adminRoute<Params>('catalog:write', async ({ request, user, supabase, params }) => {
  const productId = uuid.parse(params.id);
  const imageId = uuid.parse(params.imageId);
  const file = (await request.formData()).get('mask');
  if (!(file instanceof File) || file.size === 0) throw new ApiError(422, 'file_required', 'Choose a mask image (PNG or WebP).');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = validateUpload(bytes, 'mask', file.type);
  if (!check.ok) throw new ApiError(422, 'invalid_file', check.error);

  const bucket = supabase.storage.from(PRODUCT_IMAGE_BUCKET);
  const path = `products/${productId}/masks/${randomUUID()}.${check.extension}`;
  const upload = await bucket.upload(path, bytes, { contentType: check.mime, upsert: false });
  if (upload.error) throw upload.error;

  const previous = unwrap(await supabase.from('product_images').select('mask_storage_path').eq('id', imageId).maybeSingle()) as { mask_storage_path: string | null } | null;
  const rows = unwrap(await supabase.from('product_images').update({ mask_storage_path: path, mask_public_url: null }).eq('id', imageId).eq('product_id', productId).select('id'));
  if (!rows || rows.length === 0) {
    await bucket.remove([path]);
    return fail(404, 'not_found', 'Image not found.');
  }
  if (previous?.mask_storage_path) await bucket.remove([previous.mask_storage_path]);
  await logAudit(supabase, user, 'product.mask_updated', 'product', productId, { imageId });
  return ok({ id: imageId, path });
});

export const DELETE = adminRoute<Params>('catalog:write', async ({ user, supabase, params }) => {
  const productId = uuid.parse(params.id);
  const imageId = uuid.parse(params.imageId);
  const row = unwrap(await supabase.from('product_images').select('storage_path, mask_storage_path, is_primary').eq('id', imageId).eq('product_id', productId).maybeSingle()) as
    { storage_path: string | null; mask_storage_path: string | null; is_primary: boolean } | null;
  if (!row) return fail(404, 'not_found', 'Image not found.');

  const files = [row.storage_path, row.mask_storage_path].filter((p): p is string => Boolean(p));
  if (files.length) await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove(files);
  unwrap(await supabase.from('product_images').delete().eq('id', imageId).select('id'));

  if (row.is_primary) {
    const next = unwrap(await supabase.from('product_images').select('id').eq('product_id', productId).order('sort_order').limit(1)) as { id: string }[];
    if (next[0]) unwrap(await supabase.rpc('set_primary_image', { p_product_id: productId, p_image_id: next[0].id }));
  }
  await logAudit(supabase, user, 'product.image_removed', 'product', productId, { imageId });
  return ok({ id: imageId });
});
