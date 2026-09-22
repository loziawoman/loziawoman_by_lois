import { clientIp, isSameOrigin } from '@/lib/http';
import { ApiError, fail, handleError, ok } from '@/lib/api/response';
import { isOrderNumber } from '@/lib/orders/number';
import { submitPayment } from '@/lib/orders/service';
import { createRateLimiter } from '@/lib/rate-limit';
import { MAX_UPLOAD_BYTES } from '@/lib/storage/validate';

const limiter = createRateLimiter({ limit: 8, windowMs: 10 * 60 * 1000 });

/**
 * "I have made the payment". Multipart form: token (from the order link), optional note, optional receipt file.
 * The order becomes PAYMENT SUBMITTED for admin review. It is never marked paid here.
 */
export async function POST(request: Request, context: { params: Promise<{ orderNumber: string }> }) {
  try {
    if (!isSameOrigin(request)) return fail(403, 'forbidden_origin', 'Request blocked.');
    const limit = limiter.check(clientIp(request));
    if (!limit.allowed) return fail(429, 'rate_limited', 'Too many attempts. Please wait a few minutes and try again.', undefined, { 'Retry-After': String(limit.retryAfterSeconds) });

    const { orderNumber } = await context.params;
    if (!isOrderNumber(orderNumber)) throw new ApiError(404, 'order_not_found', 'We could not find that order.');
    if (Number(request.headers.get('content-length') ?? 0) > MAX_UPLOAD_BYTES + 100_000) throw new ApiError(413, 'too_large', 'That file is too large. The limit is 4 MB.');

    const form = await request.formData();
    const token = form.get('token');
    const note = form.get('note');
    const file = form.get('receipt');
    if (typeof token !== 'string') throw new ApiError(404, 'order_not_found', 'We could not find that order.');
    if (typeof note === 'string' && note.length > 500) throw new ApiError(422, 'note_too_long', 'Please keep the note under 500 characters.');

    const upload = file instanceof File && file.size > 0 ? { bytes: new Uint8Array(await file.arrayBuffer()), type: file.type } : undefined;
    await submitPayment({ orderNumber, token, note: typeof note === 'string' ? note.trim() : undefined, file: upload });
    return ok({ paymentStatus: 'SUBMITTED' });
  } catch (error) {
    return handleError(error);
  }
}
