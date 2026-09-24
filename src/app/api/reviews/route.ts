import { z } from 'zod';
import { clientIp, isSameOrigin } from '@/lib/http';
import { fail, handleError, ok } from '@/lib/api/response';
import { createRateLimiter } from '@/lib/rate-limit';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const limiter = createRateLimiter({ limit: 3, windowMs: 60 * 60 * 1000 });
const reviewSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.union([z.literal(''), z.string().trim().email().max(254)]).optional().default(''),
  rating: z.number().int().min(1).max(5),
  message: z.string().trim().min(5).max(1000),
}).strict();

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) return fail(403, 'forbidden_origin', 'Request blocked.');
    const limit = limiter.check(clientIp(request));
    if (!limit.allowed) return fail(429, 'rate_limited', 'Too many reviews. Please try again later.', undefined, { 'Retry-After': String(limit.retryAfterSeconds) });
    const parsed = reviewSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return fail(422, 'validation_failed', 'Please check your review and try again.');

    const { data, error } = await createSupabaseAdminClient().from('reviews').insert({
      name: parsed.data.name, email: parsed.data.email || null, rating: parsed.data.rating,
      message: parsed.data.message, status: 'visible',
    }).select('id, name, email, rating, message, status, created_at').single();
    if (error) throw error;
    return ok({ review: { ...data, createdAt: data.created_at } }, 201);
  } catch (error) {
    return handleError(error);
  }
}
