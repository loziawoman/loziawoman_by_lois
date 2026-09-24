import { adminRoute } from '@/lib/api/admin-route';
import { fail, ok, unwrap } from '@/lib/api/response';
import { logAudit } from '@/lib/audit/log';
import { uuid } from '@/lib/validation/common';

export const DELETE = adminRoute<{ id: string }>('settings:write', async ({ user, supabase, params }) => {
  const id = uuid.parse(params.id);
  const rows = unwrap(await supabase.from('contact_messages').delete().eq('id', id).select('id'));
  if (!rows?.length) return fail(404, 'not_found', 'That message could not be found.');
  await logAudit(supabase, user, 'contact_message.deleted', 'contact_message', id);
  return ok({ id });
});
