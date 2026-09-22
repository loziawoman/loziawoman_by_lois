import { clientIp, isSameOrigin } from '@/lib/http';
import { fail, handleError, ok, zodFieldErrors } from '@/lib/api/response';
import { notify } from '@/lib/notifications';
import { createRateLimiter } from '@/lib/rate-limit';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { contactSchema } from '@/lib/validation/checkout';

const limiter = createRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000 });

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) return fail(403, 'forbidden_origin', 'Request blocked.');
    const limit = limiter.check(clientIp(request));
    if (!limit.allowed) return fail(429, 'rate_limited', 'Too many messages. Please try again in a few minutes.', undefined, { 'Retry-After': String(limit.retryAfterSeconds) });

    // A filled honeypot fails validation for bots; the message is simply not stored.
    const parsed = contactSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      const honeypot = parsed.error.issues.some((issue) => issue.path[0] === 'website');
      if (honeypot) return ok({ received: true });
      return fail(422, 'validation_failed', 'Please check your details and try again.', { fieldErrors: zodFieldErrors(parsed.error) });
    }

    const { data, error } = await createSupabaseAdminClient()
      .from('contact_messages').insert({ name: parsed.data.name, email: parsed.data.email, message: parsed.data.message }).select('id').single();
    if (error) throw error;
    await notify({ type: 'contact_message', messageId: data.id });
    return ok({ received: true }, 201);
  } catch (error) {
    return handleError(error);
  }
}
