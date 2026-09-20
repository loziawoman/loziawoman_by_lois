import 'server-only';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'lozia_admin';
const SESSION_SECONDS = 60 * 60 * 24 * 7;

/** Sign-in is only available when both values are set. Otherwise /admin stays locked. */
export function authConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD) && (process.env.ADMIN_SESSION_SECRET?.length ?? 0) >= 32;
}

const sign = (value: string) =>
  createHmac('sha256', process.env.ADMIN_SESSION_SECRET ?? '').update(value).digest('base64url');

// Hash first so the comparison is constant-time even when the two strings differ in length.
function safeEqual(a: string, b: string): boolean {
  const first = createHash('sha256').update(a).digest();
  const second = createHash('sha256').update(b).digest();
  return timingSafeEqual(first, second);
}

export function passwordMatches(input: string): boolean {
  return authConfigured() && safeEqual(input, process.env.ADMIN_PASSWORD ?? '');
}

export function createSessionToken(): string {
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  return `${expires}.${sign(String(expires))}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token || !authConfigured()) return false;
  const [expires, signature] = token.split('.');
  if (!expires || !signature) return false;
  if (!safeEqual(signature, sign(expires))) return false;
  return Number(expires) > Date.now() / 1000;
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

export const sessionCookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_SECONDS,
});

/** Rejects requests that a browser sent from a different site. */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true; // not a browser cross-site request; the session cookie is still required
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
