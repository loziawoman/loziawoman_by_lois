import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AdminUser } from '@/types';

/**
 * Records an admin action. Never put secrets or personal details in `metadata`: names of fields, ids and counts only.
 * Stock, payment and order-status changes are audited inside their SQL functions; this covers catalogue and settings edits.
 */
export async function logAudit(
  supabase: SupabaseClient, user: AdminUser, action: string, entity: string, entityId: string | null, metadata: Record<string, unknown> = {},
): Promise<void> {
  const { error } = await supabase.from('audit_logs').insert({
    actor_id: user.id, actor_email: user.email, action, entity, entity_id: entityId, metadata,
  });
  if (error) console.error('[audit] could not record', action, error.message);
}
