import type { Metadata } from 'next';
import { ShopPage } from '@/views/storefront-pages';

export const metadata: Metadata = { title: 'Shop' };

type Props = { searchParams: Promise<{ category?: string | string[] }> };

export default async function Page({ searchParams }: Props) {
  const { category } = await searchParams;
  const initialCategory = Array.isArray(category) ? category[0] : category;
  // Keyed so following a "?category=" link while already on /shop resets the filter.
  return <ShopPage key={initialCategory ?? 'all'} initialCategory={initialCategory} />;
}
