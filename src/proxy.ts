import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';

// Runs only for the admin area. Real authorisation is enforced again in every page and API route.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = { matcher: ['/admin/:path*', '/api/admin/:path*'] };
