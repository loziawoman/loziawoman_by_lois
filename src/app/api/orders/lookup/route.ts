import { clientIp, isSameOrigin } from '@/lib/http';
import { fail, handleError, ok, parseJson } from '@/lib/api/response';
import { lookupOrder } from '@/lib/orders/service';
import { createRateLimiter } from '@/lib/rate-limit';
import { lookupSchema } from '@/lib/validation/checkout';

const limiter = createRateLimiter({ limit: 10, windowMs: 10 * 60 * 1000 });

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) return fail(403, 'forbidden_origin', 'Request blocked.');
    const limit = limiter.check(clientIp(request));
    if (!limit.allowed) return fail(429, 'rate_limited', 'Too many attempts. Please wait a few minutes and try again.', undefined, { 'Retry-After': String(limit.retryAfterSeconds) });

    const { orderNumber, email } = await parseJson(request, lookupSchema);
    const order = await lookupOrder(orderNumber, email);
    // Same answer whether the number or the email was wrong, so this cannot be used to discover orders.
    if (!order) return fail(404, 'not_found', 'We could not find an order matching those details.');
    return ok(order);
  } catch (error) {
    return handleError(error);
  }
}
