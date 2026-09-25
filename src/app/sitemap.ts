import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/env';
import { listPublishedProducts } from '@/lib/products/queries';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();

  if (!base) return [];

  const pages: MetadataRoute.Sitemap = [
    {
      url: base,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${base}/shop`,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${base}/about`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${base}/contact`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${base}/size-guide`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${base}/shipping`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${base}/returns`,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${base}/privacy`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${base}/terms`,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  try {
    const products = await listPublishedProducts();

    pages.push(
      ...products.map((product) => ({
        url: `${base}/shop/${product.slug}`,
        lastModified: product.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
    );
  } catch (error) {
    console.error('[sitemap] could not load products', error);
  }

  return pages;
}
