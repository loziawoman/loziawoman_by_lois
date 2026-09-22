import { randomUUID } from 'node:crypto';
import { adminRoute } from '@/lib/api/admin-route';
import { ApiError, ok, parseJson, unwrap } from '@/lib/api/response';
import { logAudit } from '@/lib/audit/log';
import { PRODUCT_IMAGE_BUCKET } from '@/lib/env';
import { MAX_UPLOAD_BYTES, validateUpload, type UploadKind } from '@/lib/storage/validate';
import { imageReorderSchema } from '@/lib/validation/admin';
import { uuid } from '@/lib/validation/common';

type Params = { id: string };

async function readFile(form: FormData, field: string, kind: UploadKind) {
  const value = form.get(field);
  if (!(value instanceof File) || value.size === 0) return null;
  const bytes = new Uint8Array(await value.arrayBuffer());
  const check = validateUpload(bytes, kind, value.type);
  if (!check.ok) throw new ApiError(422, 'invalid_file', `${field === 'mask' ? 'Mask' : 'Image'}: ${check.error}`);
  return { bytes, mime: check.mime, extension: check.extension };
}

/** Upload a product image (multipart: file, alt?, mask?). Files are checked by content before they reach storage. */
export const POST = adminRoute<Params>('catalog:write', async ({ request, user, supabase, params }) => {
  const productId = uuid.parse(params.id);
  if (Number(request.headers.get('content-length') ?? 0) > MAX_UPLOAD_BYTES * 2 + 200_000) throw new ApiError(413, 'too_large', 'Those files are too large. Each is limited to 4 MB.');
  const form = await request.formData();
  const image = await readFile(form, 'file', 'product-image');
  if (!image) throw new ApiError(422, 'file_required', 'Choose an image to upload.');
  const mask = await readFile(form, 'mask', 'mask');
  const alt = String(form.get('alt') ?? '').trim().slice(0, 300);

  const bucket = supabase.storage.from(PRODUCT_IMAGE_BUCKET);
  const imagePath = `products/${productId}/images/${randomUUID()}.${image.extension}`;
  const maskPath = mask ? `products/${productId}/masks/${randomUUID()}.${mask.extension}` : null;
  const uploaded: string[] = [];

  try {
    const first = await bucket.upload(imagePath, image.bytes, { contentType: image.mime, upsert: false });
    if (first.error) throw first.error;
    uploaded.push(imagePath);
    if (mask && maskPath) {
      const second = await bucket.upload(maskPath, mask.bytes, { contentType: mask.mime, upsert: false });
      if (second.error) throw second.error;
      uploaded.push(maskPath);
    }

    const existing = unwrap(await supabase.from('product_images').select('id, sort_order').eq('product_id', productId)) as { id: string; sort_order: number }[];
    const row = unwrap(await supabase.from('product_images').insert({
      product_id: productId, storage_path: imagePath, alt_text: alt, mask_storage_path: maskPath,
      sort_order: existing.length ? Math.max(...existing.map((e) => e.sort_order)) + 1 : 0, is_primary: existing.length === 0,
    }).select('id').single());
    await logAudit(supabase, user, 'product.image_added', 'product', productId, { imageId: row.id, hasMask: Boolean(maskPath) });
    return ok({ id: row.id, path: imagePath }, 201);
  } catch (error) {
    if (uploaded.length) await bucket.remove(uploaded);
    throw error;
  }
});

/** Reorder images: body { order: [imageId, ...] } */
export const PUT = adminRoute<Params>('catalog:write', async ({ request, user, supabase, params }) => {
  const productId = uuid.parse(params.id);
  const { order } = await parseJson(request, imageReorderSchema);
  for (const [index, id] of order.entries()) {
    unwrap(await supabase.from('product_images').update({ sort_order: index }).eq('id', id).eq('product_id', productId).select('id'));
  }
  await logAudit(supabase, user, 'product.images_reordered', 'product', productId);
  return ok({ order });
});
