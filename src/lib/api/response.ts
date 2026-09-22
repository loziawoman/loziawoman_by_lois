import { NextResponse } from 'next/server';
import { ZodError, type ZodTypeAny, type z } from 'zod';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message);
  }
}

export const ok = <T,>(data: T, status = 200) => NextResponse.json({ ok: true, data }, { status });

export const fail = (status: number, code: string, message: string, details?: unknown, headers?: HeadersInit) =>
  NextResponse.json({ ok: false, error: { code, message, ...(details === undefined ? {} : { details }) } }, { status, headers });

/** Business errors raised by the SQL functions, mapped to safe messages. */
const RPC_ERRORS: Record<string, [number, string]> = {
  FORBIDDEN: [403, 'You do not have permission to do that.'],
  ORDER_NOT_FOUND: [404, 'Order not found.'],
  VARIANT_NOT_FOUND: [404, 'That variant no longer exists.'],
  IMAGE_NOT_FOUND: [404, 'Image not found.'],
  INVALID_TRANSITION: [409, 'That is not possible for this order in its current state.'],
  ORDER_CANCELLED: [409, 'This order has been cancelled.'],
  PAYMENT_NOT_VERIFIED: [409, 'Verify the payment before moving this order forward.'],
  PAYMENT_NOT_SUBMITTABLE: [409, 'Payment can no longer be submitted for this order.'],
  REASON_REQUIRED: [422, 'Please add a reason.'],
  NOTE_REQUIRED: [422, 'Please write a note.'],
  NEGATIVE_STOCK: [409, 'Stock cannot go below zero.'],
  BELOW_RESERVED: [409, 'Stock cannot go below the units customers have already reserved.'],
  NO_CHANGE: [422, 'Nothing to change.'],
};

type DbErrorLike = { message?: string; code?: string };
const isDbError = (e: unknown): e is DbErrorLike => typeof e === 'object' && e !== null && ('message' in e || 'code' in e);

export const rpcErrorCode = (error: DbErrorLike): string => (error.message ?? '').split(':')[0].trim();

/** Field errors keyed by full path (for example "customer.email"), so forms can show each message beside its field. */
export function zodFieldErrors(error: ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) (out[issue.path.join('.') || '_'] ??= []).push(issue.message);
  return out;
}

export function handleError(error: unknown): NextResponse {
  if (error instanceof ApiError) return fail(error.status, error.code, error.message, error.details);
  if (error instanceof ZodError) return fail(422, 'validation_failed', 'Please check the details and try again.', { fieldErrors: zodFieldErrors(error) });
  if (isDbError(error)) {
    const mapped = RPC_ERRORS[rpcErrorCode(error)];
    if (mapped) return fail(mapped[0], rpcErrorCode(error).toLowerCase(), mapped[1]);
    if (error.code === '23505') return fail(409, 'conflict', 'That value is already in use. Choose a different one.');
    if (error.code === '23503') return fail(409, 'in_use', 'This is still being used elsewhere, so it cannot be changed that way.');
    if (error.code === '23514') return fail(422, 'invalid_value', 'One of the values is not allowed.');
    if (error.code === '42501') return fail(403, 'forbidden', 'You do not have permission to do that.');
    if (error.code === 'PGRST116') return fail(404, 'not_found', 'Not found.');
  }
  console.error('[api] unexpected error', error);
  return fail(500, 'server_error', 'Something went wrong. Please try again.');
}

/** Throws the Supabase error (if any) so handleError can translate it. */
export function unwrap<T>(result: { data: T; error: DbErrorLike | null }): T {
  if (result.error) throw result.error;
  return result.data;
}

const MAX_JSON_BYTES = 1_000_000;

export async function parseJson<S extends ZodTypeAny>(request: Request, schema: S): Promise<z.infer<S>> {
  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > MAX_JSON_BYTES) throw new ApiError(413, 'too_large', 'That request is too large.');
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ApiError(400, 'invalid_json', 'The request body must be valid JSON.');
  }
  return schema.parse(raw);
}
