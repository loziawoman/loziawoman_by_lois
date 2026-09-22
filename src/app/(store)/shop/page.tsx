import type { Metadata } from 'next';
import { ProductCard } from '@/components/shop/product-card';
import { ShopFilters } from '@/components/shop/shop-filters';
import { filterProducts, type ProductFilters } from '@/lib/products/mappers';
import { listCategories, listColours, listPublishedProducts, listSizes } from '@/lib/products/queries';

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Browse the LOZIA collection: dresses, sets, tailoring and more.',
  alternates: { canonical: '/shop' },
};

export const dynamic = 'force-dynamic';

type Search = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) || undefined;
const oneOf = <T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined => (allowed.includes(value as T) ? (value as T) : undefined);

export default async function ShopPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const filters: ProductFilters = {
    category: first(params.category), colour: first(params.colour), size: first(params.size), q: first(params.q),
    price: oneOf(first(params.price), ['under-100000', '100000-plus'] as const),
    availability: oneOf(first(params.availability), ['in-stock', 'sold-out'] as const),
    sort: oneOf(first(params.sort), ['featured', 'newest', 'price-asc', 'price-desc'] as const),
  };

  const [all, categories, colours, sizes] = await Promise.all([listPublishedProducts(), listCategories(), listColours(), listSizes()]);
  const products = filterProducts(all, filters);
  const heading = categories.find((c) => c.slug === filters.category)?.name ?? 'The collection';

  return (
    <main className="mx-auto max-w-[1440px] px-5 py-12 md:px-10 md:py-20">
      <span className="mono text-[hsl(var(--accent))]">Shop</span>
      <h1 className="serif mt-3 text-6xl md:text-8xl">{heading}</h1>
      <div className="mt-10"><ShopFilters categories={categories} colours={colours} sizes={sizes} /></div>
      <p className="mono mt-6 text-[hsl(var(--muted-foreground))]" role="status">{products.length} {products.length === 1 ? 'piece' : 'pieces'}</p>
      {products.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <div className="mt-16 max-w-[460px]">
          <h2 className="serif text-3xl">Nothing matches just yet.</h2>
          <p className="mt-3 text-sm leading-7 text-[hsl(var(--muted-foreground))]">Try removing a filter, or browse the whole collection.</p>
        </div>
      )}
    </main>
  );
}
