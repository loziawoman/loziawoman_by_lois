import { fail, handleError, ok } from '@/lib/api/response';
import { isSameOrigin } from '@/lib/http';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) return fail(403, 'forbidden_origin', 'Request blocked.');
    await (await createSupabaseServerClient()).auth.signOut();
    return ok({ signedOut: true });
  } catch (error) {
    return handleError(error);
  }
}
