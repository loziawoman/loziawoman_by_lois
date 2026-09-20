import { NextResponse } from 'next/server';
import {
  SESSION_COOKIE,
  authConfigured,
  createSessionToken,
  isSameOrigin,
  passwordMatches,
  sessionCookieOptions,
} from '@/server/admin-auth';

// Basic brute-force guard: 8 wrong passwords per address every 15 minutes (per server process).
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 8;
const failures = new Map<string, { count: number; resetAt: number }>();

const clientKey = (request: Request) =>
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Request blocked.' }, { status: 403 });
  if (!authConfigured()) {
    return NextResponse.json(
      { error: 'Admin sign-in is not set up yet. Set ADMIN_PASSWORD and ADMIN_SESSION_SECRET on the server.' },
      { status: 503 },
    );
  }

  const key = clientKey(request);
  const now = Date.now();
  const record = failures.get(key);
  if (record && record.resetAt > now && record.count >= MAX_FAILURES) {
    return NextResponse.json({ error: 'Too many attempts. Try again in a few minutes.' }, { status: 429 });
  }

  let password = '';
  try {
    const body = (await request.json()) as { password?: unknown };
    password = typeof body.password === 'string' ? body.password : '';
  } catch {
    return NextResponse.json({ error: 'Send the password as JSON.' }, { status: 400 });
  }

  if (!passwordMatches(password)) {
    const active = record && record.resetAt > now ? record : { count: 0, resetAt: now + WINDOW_MS };
    failures.set(key, { count: active.count + 1, resetAt: active.resetAt });
    return NextResponse.json({ error: 'That password is not right.' }, { status: 401 });
  }

  failures.delete(key);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, createSessionToken(), sessionCookieOptions());
  return response;
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Request blocked.' }, { status: 403 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 });
  return response;
}
