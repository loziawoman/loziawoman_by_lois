import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/env';
import { listPublishedProducts } from '@/lib/products/queries';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  if (!base) return []; // set NEXT_PUBLIC_SITE_URL so sitemap URLs are absolute
  const pages = ['', '/shop', '/about', '/contact', '/size-guide', '/shipping', '/returns', '/privacy', '/terms'];
  const entries: MetadataRoute.Sitemap = pages.map((path) => ({ url: `${base}${path}`, changeFrequency: path === '' || path === '/shop' ? 'daily' : 'monthly' }));

  try {
    const products = await listPublishedProducts();
    entries.push(...products.map((p) => ({ url: `${base}/shop/${p.slug}`, lastModified: p.updatedAt, changeFrequency: 'weekly' as const })));
  } catch (error) {
    console.error('[sitemap] could not load products', error);
  }
  return entries;
}
