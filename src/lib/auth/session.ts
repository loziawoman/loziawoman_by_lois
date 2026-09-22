import 'server-only';
import { redirect } from 'next/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AdminUser } from '@/types';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { authorize, isUserRole, type Permission } from './permissions';
import { fail } from '@/lib/api/response';
import { isSameOrigin } from '@/lib/http';

/** The signed-in user and their role, or null. The token is validated with Supabase Auth, not just read from the cookie. */
export async function getCurrentUser(supabase?: SupabaseClient): Promise<AdminUser | null> {
  const client = supabase ?? (await createSupabaseServerClient());
  const { data } = await client.auth.getUser();
  if (!data.user) return null;
  const { data: profile } = await client.from('profiles').select('role').eq('id', data.user.id).maybeSingle();
  return { id: data.user.id, email: data.user.email ?? '', role: isUserRole(profile?.role) ? profile.role : 'customer' };
}

/** For admin pages: sends visitors to the login page, or shows them the way out if their role is not enough. */
export async function requirePermission(permission: Permission): Promise<{ user: AdminUser; supabase: SupabaseClient }> {
  const supabase = await createSupabaseServerClient();
  const decision = authorize(await getCurrentUser(supabase), permission);
  if (!decision.ok) redirect(decision.status === 401 ? '/admin/login' : '/admin/login?error=forbidden');
  return { user: decision.user, supabase };
}

export type ApiAuth = { ok: true; user: AdminUser; supabase: SupabaseClient } | { ok: false; response: Response };

/** For admin API routes: same-origin check, then authentication, then the permission check. */
export async function authorizeRequest(request: Request, permission: Permission): Promise<ApiAuth> {
  if (!isSameOrigin(request)) return { ok: false, response: fail(403, 'forbidden_origin', 'Request blocked.') };
  const supabase = await createSupabaseServerClient();
  const decision = authorize(await getCurrentUser(supabase), permission);
  if (!decision.ok) {
    const message = decision.status === 401 ? 'Please sign in.' : 'You do not have permission to do that.';
    return { ok: false, response: fail(decision.status, decision.code, message) };
  }
  return { ok: true, user: decision.user, supabase };
}
