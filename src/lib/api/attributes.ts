import 'server-only';
import type { ZodTypeAny, z } from 'zod';
import { adminRoute } from './admin-route';
import { fail, ok, parseJson, unwrap } from './response';
import { logAudit } from '@/lib/audit/log';
import { uuid } from '@/lib/validation/common';

/**
 * Create / update / delete handlers for a small reference table (colours, sizes, categories).
 * `toRow` maps the validated input to database columns.
 */
export function attributeHandlers<S extends ZodTypeAny>(config: { table: string; entity: string; schema: S; toRow: (input: z.infer<S>) => Record<string, unknown> }) {
  const create = adminRoute('catalog:write', async ({ request, user, supabase }) => {
    const input = await parseJson(request, config.schema);
    const row = unwrap(await supabase.from(config.table).insert(config.toRow(input)).select('id').single());
    await logAudit(supabase, user, `${config.entity}.created`, config.entity, row.id);
    return ok({ id: row.id }, 201);
  });

  const update = adminRoute<{ id: string }>('catalog:write', async ({ request, user, supabase, params }) => {
    const id = uuid.parse(params.id);
    const input = await parseJson(request, config.schema);
    const rows = unwrap(await supabase.from(config.table).update(config.toRow(input)).eq('id', id).select('id'));
    if (!rows || rows.length === 0) return fail(404, 'not_found', 'Not found.');
    await logAudit(supabase, user, `${config.entity}.updated`, config.entity, id);
    return ok({ id });
  });

  const remove = adminRoute<{ id: string }>('catalog:write', async ({ user, supabase, params }) => {
    const id = uuid.parse(params.id);
    const rows = unwrap(await supabase.from(config.table).delete().eq('id', id).select('id')); // foreign keys refuse deletion while in use
    if (!rows || rows.length === 0) return fail(404, 'not_found', 'Not found.');
    await logAudit(supabase, user, `${config.entity}.deleted`, config.entity, id);
    return ok({ id });
  });

  return { create, update, remove };
}
