import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AdminUser } from '@/types';
import type { Permission } from '@/lib/auth/permissions';
import { authorizeRequest } from '@/lib/auth/session';
import { handleError } from './response';

export type AdminContext<P> = { request: Request; user: AdminUser; supabase: SupabaseClient; params: P };

/**
 * Wraps an admin route handler so authentication, authorisation and error handling can never be forgotten:
 * the handler only runs for a signed-in user who holds `permission`, and every failure becomes a safe JSON error.
 */
export function adminRoute<P = Record<string, never>>(permission: Permission, handler: (ctx: AdminContext<P>) => Promise<Response>) {
  return async (request: Request, context?: { params: Promise<P> }): Promise<Response> => {
    try {
      const auth = await authorizeRequest(request, permission);
      if (!auth.ok) return auth.response;
      const params = context ? await context.params : ({} as P);
      return await handler({ request, user: auth.user, supabase: auth.supabase, params });
    } catch (error) {
      return handleError(error);
    }
  };
}
