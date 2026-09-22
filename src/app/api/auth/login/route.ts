import { z } from 'zod';
import { clientIp, isSameOrigin } from '@/lib/http';
import { fail, handleError, ok, parseJson } from '@/lib/api/response';
import { getCurrentUser } from '@/lib/auth/session';
import { isStaffRole } from '@/lib/auth/permissions';
import { createRateLimiter } from '@/lib/rate-limit';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const limiter = createRateLimiter({ limit: 10, windowMs: 15 * 60 * 1000 });
const schema = z.object({ email: z.string().trim().email().max(254), password: z.string().min(1).max(200) }).strict();

/** Staff sign-in. Customers do not need an account to shop. */
export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) return fail(403, 'forbidden_origin', 'Request blocked.');
    const limit = limiter.check(clientIp(request));
    if (!limit.allowed) return fail(429, 'rate_limited', 'Too many attempts. Try again in a few minutes.', undefined, { 'Retry-After': String(limit.retryAfterSeconds) });

    const { email, password } = await parseJson(request, schema);
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return fail(401, 'invalid_credentials', 'Incorrect email or password.');

    const user = await getCurrentUser(supabase);
    if (!user || !isStaffRole(user.role)) {
      await supabase.auth.signOut();
      return fail(403, 'forbidden', 'This account does not have access to the studio desk.');
    }
    return ok({ role: user.role });
  } catch (error) {
    return handleError(error);
  }
}
