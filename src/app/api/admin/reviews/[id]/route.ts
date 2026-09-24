import { z } from 'zod';
import { adminRoute } from '@/lib/api/admin-route';
import { fail, ok, parseJson, unwrap } from '@/lib/api/response';
import { logAudit } from '@/lib/audit/log';
import { uuid } from '@/lib/validation/common';

const paramsSchema = z.object({ id: uuid });
const statusSchema = z.object({ status: z.enum(['visible', 'hidden', 'spotlight']) });

export const PATCH = adminRoute<{ id: string }>('settings:write', async ({ request, user, supabase, params }) => {
  const id = paramsSchema.parse(params).id;
  const input = await parseJson(request, statusSchema);
  const rows = unwrap(await supabase.from('reviews').update({ status: input.status }).eq('id', id).select('id, status'));
  if (!rows?.length) return fail(404, 'not_found', 'That review could not be found.');
  await logAudit(supabase, user, `review.${input.status}`, 'review', id);
  return ok({ id, status: input.status });
});

export const DELETE = adminRoute<{ id: string }>('settings:write', async ({ user, supabase, params }) => {
  const id = paramsSchema.parse(params).id;
  const rows = unwrap(await supabase.from('reviews').delete().eq('id', id).select('id'));
  if (!rows?.length) return fail(404, 'not_found', 'That review could not be found.');
  await logAudit(supabase, user, 'review.deleted', 'review', id);
  return ok({ id });
});
