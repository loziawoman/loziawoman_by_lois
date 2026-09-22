import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { supabasePublicEnv, supabaseServiceRoleKey } from '@/lib/env';

/**
 * Service-role client. It bypasses Row Level Security, so it is used only for guest checkout flows
 * (creating an order, submitting a payment, storing a contact message, private receipt storage) and never for anything
 * an unauthenticated visitor could steer beyond the validated inputs of those routes.
 */
export function createSupabaseAdminClient() {
  return createClient(supabasePublicEnv().url, supabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
