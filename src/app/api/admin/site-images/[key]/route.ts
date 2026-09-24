import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { adminRoute } from '@/lib/api/admin-route';
import { ApiError, ok, parseJson, unwrap } from '@/lib/api/response';
import { logAudit } from '@/lib/audit/log';
import { SITE_IMAGE_BUCKET } from '@/lib/env';
import { SETTING_DEFINITIONS } from '@/lib/settings/definitions';
import { SITE_IMAGE_KEYS, defaultSiteImages } from '@/lib/content/site-images';
import type { SiteImageKey, SiteImages } from '@/types';

type Params = { key: string };
const patchSchema = z.object({ alt: z.string().trim().max(300) }).strict();

function keyFrom(value: string): SiteImageKey {
  if (!SITE_IMAGE_KEYS.includes(value as SiteImageKey)) throw new ApiError(404, 'not_found', 'That website image slot does not exist.');
  return value as SiteImageKey;
}

async function readCurrent(supabase: SupabaseClient): Promise<SiteImages> {
  const row = unwrap(await supabase.from('site_settings').select('value').eq('key', 'site_images').maybeSingle()) as { value?: unknown } | null;
  const parsed = SETTING_DEFINITIONS.site_images.schema.safeParse(row?.value);
  return parsed.success ? parsed.data : defaultSiteImages();
}

export const PATCH = adminRoute<Params>('settings:write', async ({ request, user, supabase, params }) => {
  const key = keyFrom(params.key);
  const { alt } = await parseJson(request, patchSchema);
  const images = await readCurrent(supabase);
  const next: SiteImages = { ...images, [key]: { ...images[key], alt } };
  unwrap(await supabase.from('site_settings').upsert({ key: 'site_images', value: next, is_public: true, updated_by: user.id, updated_at: new Date().toISOString() }, { onConflict: 'key' }));
  await logAudit(supabase, user, 'settings.site_image_alt_updated', 'site_image', key, {});
  return ok({ key, alt });
});

export const DELETE = adminRoute<Params>('settings:write', async ({ user, supabase, params }) => {
  const key = keyFrom(params.key);
  const images = await readCurrent(supabase);
  const previous = images[key];
  const defaults = defaultSiteImages();
  const next: SiteImages = { ...images, [key]: defaults[key] };
  unwrap(await supabase.from('site_settings').upsert({ key: 'site_images', value: next, is_public: true, updated_by: user.id, updated_at: new Date().toISOString() }, { onConflict: 'key' }));
  if (previous.storagePath) await supabase.storage.from(SITE_IMAGE_BUCKET).remove([previous.storagePath]);
  await logAudit(supabase, user, 'settings.site_image_reset', 'site_image', key, {});
  return ok({ key, reset: true });
});
