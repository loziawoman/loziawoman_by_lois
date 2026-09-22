import { clientIp, isSameOrigin } from '@/lib/http';
import { fail, handleError, ok, parseJson } from '@/lib/api/response';
import { createOrder } from '@/lib/orders/service';
import { createRateLimiter } from '@/lib/rate-limit';
import { checkoutSchema } from '@/lib/validation/checkout';

const limiter = createRateLimiter({ limit: 10, windowMs: 10 * 60 * 1000 });

/** Guest checkout. The body carries variant ids, quantities and contact details only; prices are decided on the server. */
export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) return fail(403, 'forbidden_origin', 'Request blocked.');
    const limit = limiter.check(clientIp(request));
    if (!limit.allowed) return fail(429, 'rate_limited', 'Too many attempts. Please wait a few minutes and try again.', undefined, { 'Retry-After': String(limit.retryAfterSeconds) });

    const input = await parseJson(request, checkoutSchema);
    const order = await createOrder(input);
    return ok(order, 201);
  } catch (error) {
    return handleError(error);
  }
}
