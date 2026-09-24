// Environment access. Everything is read lazily inside functions so `next build` never needs secrets.
// Values prefixed NEXT_PUBLIC_ are visible to the browser. The service-role key is server-only and must never be prefixed.

export function supabasePublicEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (see .env.example).');
  }
  return { url: url.replace(/\/+$/, ''), anonKey };
}

export const isSupabaseConfigured = (): boolean =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export function supabaseServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set (server-only; see .env.example).');
  return key;
}

export const PRODUCT_IMAGE_BUCKET = 'product-images';
export const SITE_IMAGE_BUCKET = 'site-images';
export const RECEIPT_BUCKET = 'payment-receipts';

/** Public URL prefix of the product image bucket, ending in a slash. */
export const productImageBaseUrl = (): string => `${supabasePublicEnv().url}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/`;

/** Canonical site URL for metadata, sitemap and robots. Set NEXT_PUBLIC_SITE_URL in production. */
export function siteUrl(): string | undefined {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, '');
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return vercel ? `https://${vercel}` : undefined;
}
