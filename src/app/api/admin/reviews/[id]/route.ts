import { adminRoute } from '@/lib/api/admin-route';
import { fail, ok, parseJson, unwrap } from '@/lib/api/response';
import { uuid } from '@/lib/validation/common';
import { z } from 'zod';

const schema = z.object({ status: z.enum(['visible', 'hidden', 'spotlight']) });

export const PATCH = adminRoute<{ id: string }>('settings:write', async ({ request, supabase, params }) => {
  const id = uuid.parse(params.id);
  const input = await parseJson(request, schema);
  const review = unwrap(
    await supabase
      .from('reviews')
      .update({ status: input.status })
      .eq('id', id)
      .select('id, name, email, rating, message, status, created_at')
      .single()
  );
  return ok(review);
});

export const DELETE = adminRoute<{ id: string }>('settings:write', async ({ supabase, params }) => {
  const id = uuid.parse(params.id);
  unwrap(await supabase.from('reviews').delete().eq('id', id));
  return ok({ id, deleted: true });
});
