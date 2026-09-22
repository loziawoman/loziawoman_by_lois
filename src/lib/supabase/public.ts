import { createClient } from '@supabase/supabase-js';
import { supabasePublicEnv } from '@/lib/env';

/** Anonymous client for public catalogue reads. Row Level Security limits it to published products and public settings. */
export function createSupabasePublicClient() {
  const { url, anonKey } = supabasePublicEnv();
  return createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
