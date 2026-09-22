import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { supabasePublicEnv } from '@/lib/env';

/** Client that acts as the signed-in user (staff), so Row Level Security applies to everything it does. */
export async function createSupabaseServerClient() {
  const { url, anonKey } = supabasePublicEnv();
  const store = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Called from a Server Component, which cannot set cookies. proxy.ts refreshes the session instead.
        }
      },
    },
  });
}
