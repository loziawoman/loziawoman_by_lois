import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/checkout', '/order-confirmed', '/track-order'] }],
    ...(base ? { sitemap: `${base}/sitemap.xml`, host: base } : {}),
  };
}
