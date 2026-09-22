// Browser-side helper for calling this app's own API routes. Always resolves; never throws.

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; fieldErrors: Record<string, string[]>; status: number };

type ErrorBody = { error?: { message?: string; details?: { fieldErrors?: Record<string, string[]> } } };

export async function apiRequest<T = unknown>(url: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  try {
    const isForm = typeof FormData !== 'undefined' && init.body instanceof FormData;
    const response = await fetch(url, {
      ...init,
      headers: isForm || !init.body ? init.headers : { 'Content-Type': 'application/json', ...init.headers },
    });
    const body = (await response.json().catch(() => null)) as ({ ok?: boolean; data?: T } & ErrorBody) | null;
    if (response.ok && body?.ok) return { ok: true, data: body.data as T };
    return {
      ok: false, status: response.status,
      message: body?.error?.message ?? 'Something went wrong. Please try again.',
      fieldErrors: body?.error?.details?.fieldErrors ?? {},
    };
  } catch {
    return { ok: false, status: 0, message: 'We could not reach the server. Check your connection and try again.', fieldErrors: {} };
  }
}

export const jsonBody = (value: unknown): string => JSON.stringify(value);
