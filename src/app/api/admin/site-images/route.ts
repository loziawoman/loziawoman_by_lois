import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { adminRoute } from '@/lib/api/admin-route';
import { ApiError, ok, unwrap } from '@/lib/api/response';
import { logAudit } from '@/lib/audit/log';
import { SITE_IMAGE_BUCKET, supabasePublicEnv } from '@/lib/env';
import { validateUpload, MAX_UPLOAD_BYTES } from '@/lib/storage/validate';
import { SETTING_DEFINITIONS } from '@/lib/settings/definitions';
import type { SiteImageKey, SiteImages } from '@/types';
import { SITE_IMAGE_KEYS, SITE_IMAGE_META, defaultSiteImages } from '@/lib/content/site-images';

async function readCurrent(supabase: SupabaseClient): Promise<SiteImages> {
  const row = unwrap(await supabase.from('site_settings').select('value').eq('key', 'site_images').maybeSingle()) as { value?: unknown } | null;
  const parsed = SETTING_DEFINITIONS.site_images.schema.safeParse(row?.value);
  return parsed.success ? parsed.data : defaultSiteImages();
}

function keyFrom(value: string): SiteImageKey {
  if (!SITE_IMAGE_KEYS.includes(value as SiteImageKey)) throw new ApiError(422, 'invalid_key', 'That website image slot does not exist.');
  return value as SiteImageKey;
}

export const POST = adminRoute('settings:write', async ({ request, user, supabase }) => {
  if (Number(request.headers.get('content-length') ?? 0) > MAX_UPLOAD_BYTES + 100_000) throw new ApiError(413, 'too_large', 'The image is too large. The limit is 4 MB.');
  const form = await request.formData();
  const key = keyFrom(String(form.get('key') ?? ''));
  const value = form.get('file');
  if (!(value instanceof File) || value.size === 0) throw new ApiError(422, 'file_required', 'Choose an image to upload.');

  const bytes = new Uint8Array(await value.arrayBuffer());
  const check = validateUpload(bytes, 'product-image', value.type);
  if (!check.ok) throw new ApiError(422, 'invalid_file', `Image: ${check.error}`);

  const alt = String(form.get('alt') ?? '').trim().slice(0, 300);
  const images = await readCurrent(supabase);
  const previous = images[key];
  const path = `site/${key}/${randomUUID()}.${check.extension}`;
  const bucket = supabase.storage.from(SITE_IMAGE_BUCKET);
  const upload = await bucket.upload(path, bytes, { contentType: check.mime, upsert: false });
  if (upload.error) throw upload.error;

  const { url } = supabasePublicEnv();
  const next: SiteImages = {
    ...images,
    [key]: {
      src: `${url}/storage/v1/object/public/${SITE_IMAGE_BUCKET}/${path}`,
      alt: alt || SITE_IMAGE_META[key].alt,
      storagePath: path,
    },
  };

  try {
    unwrap(await supabase.from('site_settings').upsert({
      key: 'site_images', value: next, is_public: true, updated_by: user.id, updated_at: new Date().toISOString(),
    }, { onConflict: 'key' }));
  } catch (error) {
    await bucket.remove([path]);
    throw error;
  }

  if (previous.storagePath) await bucket.remove([previous.storagePath]);
  await logAudit(supabase, user, 'settings.site_image_updated', 'site_image', key, { path });
  return ok({ key, src: next[key].src }, 201);
});
