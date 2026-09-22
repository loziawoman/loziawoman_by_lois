'use client';

import { useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Category, ProductColour, ProductSize } from '@/types';

const field = 'h-11 w-full border border-[hsl(var(--border))] bg-transparent px-3 text-sm';

/** Filters live in the URL (for example /shop?category=dresses&colour=burgundy) so any view can be shared or bookmarked. */
export function ShopFilters({ categories, colours, sizes }: { categories: Category[]; colours: ProductColour[]; sizes: ProductSize[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(params.get('q') ?? '');

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    startTransition(() => router.replace(`${pathname}${next.size ? `?${next}` : ''}`, { scroll: false }));
  };

  // Debounce typing so the server is not asked on every keystroke.
  useEffect(() => {
    if (query === (params.get('q') ?? '')) return;
    const timer = window.setTimeout(() => update('q', query.trim()), 350);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const active = ['category', 'colour', 'size', 'price', 'availability', 'sort', 'q'].some((key) => params.get(key));
  const select = (key: string, label: string, options: { value: string; label: string }[]) => (
    <label className="grid gap-1 text-xs">
      <span className="mono">{label}</span>
      <select className={field} value={params.get(key) ?? ''} onChange={(event) => update(key, event.target.value)}>
        <option value="">All</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );

  return (
    <details className="group border-y border-[hsl(var(--border))] py-4 md:open:block" open>
      <summary className="mono flex min-h-11 cursor-pointer items-center justify-between md:hidden">Filter &amp; sort <span aria-hidden="true">+</span></summary>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 md:mt-0 md:grid-cols-4 lg:grid-cols-8" aria-busy={pending}>
        <label className="grid gap-1 text-xs sm:col-span-2 md:col-span-2 lg:col-span-2">
          <span className="mono">Search</span>
          <input type="search" className={field} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the collection" />
        </label>
        {select('category', 'Category', categories.map((c) => ({ value: c.slug, label: c.name })))}
        {select('colour', 'Colour', colours.map((c) => ({ value: c.slug, label: c.name })))}
        {select('size', 'Size', sizes.map((s) => ({ value: s.name, label: s.name })))}
        {select('price', 'Price', [{ value: 'under-100000', label: 'Under ₦100,000' }, { value: '100000-plus', label: '₦100,000 and over' }])}
        {select('availability', 'Availability', [{ value: 'in-stock', label: 'In stock' }, { value: 'sold-out', label: 'Sold out' }])}
        <label className="grid gap-1 text-xs">
          <span className="mono">Sort</span>
          <select className={field} value={params.get('sort') ?? ''} onChange={(event) => update('sort', event.target.value)}>
            <option value="">Featured</option>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </label>
      </div>
      {active && (
        <button type="button" onClick={() => { setQuery(''); startTransition(() => router.replace(pathname, { scroll: false })); }} className="mono mt-4 underline-link min-h-11">
          Clear all filters
        </button>
      )}
    </details>
  );
}
