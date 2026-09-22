import { z } from 'zod';
import { adminRoute } from '@/lib/api/admin-route';
import { ApiError, ok, parseJson, unwrap } from '@/lib/api/response';
import { logAudit } from '@/lib/audit/log';
import { SETTING_DEFINITIONS, isSettingKey } from '@/lib/settings/definitions';

const bodySchema = z.object({ values: z.record(z.string(), z.unknown()) }).strict();

/** Save one or more settings. Each key is validated against its own schema; unknown keys are refused. */
export const PUT = adminRoute('settings:write', async ({ request, user, supabase }) => {
  const { values } = await parseJson(request, bodySchema);
  const rows = Object.entries(values).map(([key, value]) => {
    if (!isSettingKey(key)) throw new ApiError(422, 'unknown_setting', `"${key}" is not a setting.`);
    const definition = SETTING_DEFINITIONS[key];
    const parsed = definition.schema.safeParse(value);
    if (!parsed.success) throw new ApiError(422, 'invalid_setting', `${key}: ${parsed.error.issues[0]?.message ?? 'not valid'}`);
    return { key, value: parsed.data, is_public: definition.isPublic, updated_by: user.id, updated_at: new Date().toISOString() };
  });
  if (rows.length === 0) return ok({ saved: [] });

  unwrap(await supabase.from('site_settings').upsert(rows, { onConflict: 'key' }));
  // Keys only: setting values (such as bank details) never go into the audit log.
  await logAudit(supabase, user, 'settings.updated', 'settings', null, { keys: rows.map((r) => r.key) });
  return ok({ saved: rows.map((r) => r.key) });
});
