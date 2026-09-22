import { NextResponse } from 'next/server';
import { handleError } from '@/lib/api/response';
import { filterProducts, type ProductFilters } from '@/lib/products/mappers';
import { listPublishedProducts } from '@/lib/products/queries';

const pick = <T extends string>(value: string | null, allowed: readonly T[]): T | undefined => (allowed.includes(value as T) ? (value as T) : undefined);

export async function GET(request: Request) {
  try {
    const p = new URL(request.url).searchParams;
    const filters: ProductFilters = {
      category: p.get('category') ?? undefined,
      colour: p.get('colour') ?? undefined,
      size: p.get('size') ?? undefined,
      q: p.get('q') ?? undefined,
      price: pick(p.get('price'), ['under-100000', '100000-plus'] as const),
      availability: pick(p.get('availability'), ['in-stock', 'sold-out'] as const),
      sort: pick(p.get('sort'), ['featured', 'newest', 'price-asc', 'price-desc'] as const),
    };
    const products = filterProducts(await listPublishedProducts(), filters);
    return NextResponse.json({ ok: true, data: products }, { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } });
  } catch (error) {
    return handleError(error);
  }
}
