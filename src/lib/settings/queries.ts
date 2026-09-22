import 'server-only';
import { cache } from 'react';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabasePublicClient } from '@/lib/supabase/public';
import { isSupabaseConfigured } from '@/lib/env';
import type { BankDetails, SiteSettings } from '@/types';
import { buildBankDetails, buildSiteSettings, PRIVATE_SETTING_KEYS } from './definitions';

/** Public site settings (brand, contact, policies, shipping rates). Falls back to safe defaults if the database is unreachable. */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  if (!isSupabaseConfigured()) return buildSiteSettings([]);
  try {
    const { data, error } = await createSupabasePublicClient().from('site_settings').select('key, value');
    if (error) throw error;
    return buildSiteSettings(data ?? []);
  } catch (error) {
    console.error('[settings] could not load, using defaults', error);
    return buildSiteSettings([]);
  }
});

/** Bank details, read with the service role. Only ever shown to someone holding a valid order link. */
export async function getBankDetails(): Promise<BankDetails> {
  const { data, error } = await createSupabaseAdminClient().from('site_settings').select('key, value').in('key', PRIVATE_SETTING_KEYS);
  if (error) throw error;
  return buildBankDetails(data ?? []);
}
