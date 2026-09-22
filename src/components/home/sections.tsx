import Link from 'next/link';
import { ArrowRight, Instagram } from 'lucide-react';
import { LoziaImage } from '@/components/lozia-image';
import { ProductCard } from '@/components/shop/product-card';
import type { Category, HomepageContent, Product } from '@/types';

export function Hero({ homepage, tagline }: { homepage: HomepageContent; tagline: string }) {
  return (
    <section className="relative min-h-[calc(100dvh-74px)] overflow-hidden bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_42%,hsl(var(--accent))/18%,transparent_42%)]" />
      <div className="absolute right-[-18%] top-[8%] h-[86vw] max-h-[680px] w-[86vw] max-w-[680px] overflow-hidden rounded-full border border-[hsl(var(--secondary))]/35 shadow-2xl md:right-[5%] md:top-[9%]">
        <LoziaImage src="/images/lozia-logo.jpeg" alt="" fill sizes="(min-width: 768px) 680px, 86vw" loading="eager" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--primary))]/80 via-transparent to-transparent md:from-[hsl(var(--primary))]/35" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--primary))] via-[hsl(var(--primary))]/70 to-transparent" />
      <div className="relative mx-auto flex min-h-[calc(100dvh-74px)] max-w-[1440px] items-end px-5 pb-16 md:items-center md:px-16 md:pb-0">
        <div className="reveal max-w-[700px]">
          <span className="mono text-[hsl(var(--secondary))]">{homepage.eyebrow}</span>
          <h1 className="serif mt-5 text-[clamp(3.8rem,9vw,8.8rem)] leading-[.88] tracking-[-.05em]">{homepage.headline}<br /><i>{homepage.italicHeadline}</i></h1>
          <p className="mt-8 max-w-[380px] text-base leading-7 text-[hsl(var(--primary-foreground))]/70">{homepage.description}</p>
          <Link href="/shop" className="mt-9 inline-flex min-h-12 items-center gap-4 border border-[hsl(var(--secondary))] px-6 py-4 mono text-[hsl(var(--secondary))] transition-colors hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--primary))]" data-testid="link-hero-shop">
            {homepage.ctaLabel} <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
        {tagline && <div className="absolute bottom-10 right-12 hidden max-w-[220px] text-right md:block"><span className="mono text-[hsl(var(--primary-foreground))]/45">{tagline}</span></div>}
      </div>
    </section>
  );
}

export function FeaturedCollection({ products }: { products: Product[] }) {
  return (
    <section className="mx-auto max-w-[1440px] px-5 py-20 md:px-10 md:py-28" aria-labelledby="featured-heading">
      <div className="flex items-end justify-between">
        <div>
          <span className="mono text-[hsl(var(--accent))]">The collection</span>
          <h2 id="featured-heading" className="serif mt-3 text-5xl md:text-7xl">Quiet confidence,<br /><i>cut into form.</i></h2>
          <p className="mt-5 max-w-[480px] text-sm leading-7 text-[hsl(var(--muted-foreground))]">LOZIA brings together refined silhouettes, considered details and pieces made to move with the woman wearing them.</p>
        </div>
        <Link href="/shop" className="mono underline-link hidden items-center gap-2 md:flex" data-testid="link-view-all">View all <ArrowRight size={14} aria-hidden="true" /></Link>
      </div>
      {products.length > 0 ? (
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-6">
          {products.map((p) => <ProductCard key={p.id} product={p} sizes="(min-width: 768px) 25vw, 50vw" />)}
        </div>
      ) : (
        <p className="mt-10 text-sm text-[hsl(var(--muted-foreground))]">New pieces are on their way.</p>
      )}
      <Link href="/shop" className="mono underline-link mt-8 flex min-h-11 items-center gap-2 md:hidden" data-testid="mobile-link-view-all">View all <ArrowRight size={14} aria-hidden="true" /></Link>
    </section>
  );
}

const tileStyles = [
  { box: 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]', dim: 'opacity-45', label: 'text-[hsl(var(--secondary))]', overlay: '' },
  { box: 'bg-[hsl(var(--accent))] text-[hsl(var(--primary))]', dim: 'opacity-55', label: '', overlay: '' },
  { box: 'bg-[hsl(var(--muted))]', dim: '', label: 'text-[hsl(var(--secondary))]', overlay: 'bg-gradient-to-t from-black/55 to-transparent text-white' },
];

export function CategoryTiles({ categories, products }: { categories: Category[]; products: Product[] }) {
  const tiles = categories
    .map((category) => {
      const inCategory = products.filter((p) => p.category?.id === category.id);
      return { category, image: category.imageUrl ?? inCategory[0]?.images[0]?.src ?? null, count: inCategory.length };
    })
    .filter((tile) => tile.count > 0)
    .slice(0, 3);
  if (tiles.length === 0) return null;

  return (
    <section className="mx-auto grid max-w-[1440px] gap-4 px-5 pb-20 md:grid-cols-3 md:px-10" aria-label="Shop by category">
      {tiles.map(({ category, image }, index) => {
        const style = tileStyles[index % tileStyles.length];
        return (
          <Link key={category.id} href={`/shop?category=${category.slug}`} className={`group relative min-h-[360px] overflow-hidden ${style.box}`}>
            <LoziaImage src={image} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className={`image-hover object-cover ${style.dim}`} />
            <div className={`relative flex h-full min-h-[360px] flex-col justify-end p-7 ${style.overlay}`}>
              <span className={`mono ${style.label}`}>Shop by category</span>
              <h3 className="serif mt-2 text-4xl">{category.name}</h3>
            </div>
          </Link>
        );
      })}
    </section>
  );
}

export function LoziaWoman({ image }: { image: string | null }) {
  return (
    <section className="grid min-h-[650px] md:grid-cols-2">
      <div className="flex items-center bg-[hsl(var(--accent))] px-8 py-20 text-[hsl(var(--primary))] md:px-20">
        <div className="max-w-[470px]">
          <span className="mono">The LOZIA woman</span>
          <blockquote className="serif mt-7 text-5xl leading-[1.05] md:text-7xl">“She does not dress for attention. She dresses because expression is part of who she is.”</blockquote>
          <Link href="/about" className="mt-8 inline-flex min-h-11 items-center gap-3 border-b border-current pb-2 mono" data-testid="link-about-story">Discover LOZIA <ArrowRight size={14} aria-hidden="true" /></Link>
        </div>
      </div>
      <div className="relative min-h-[500px] overflow-hidden bg-[hsl(var(--muted))]">
        <LoziaImage src={image} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="image-hover object-cover" />
      </div>
    </section>
  );
}

export function FeaturedPieces({ products, instagramUrl }: { products: Product[]; instagramUrl: string }) {
  if (products.length === 0) return null;
  return (
    <section className="mx-auto max-w-[1440px] px-5 py-20 md:px-10 md:py-28" aria-labelledby="pieces-heading">
      <div className="flex items-end justify-between gap-6">
        <div>
          <span className="mono text-[hsl(var(--accent))]">Featured pieces</span>
          <h2 id="pieces-heading" className="serif mt-4 text-5xl md:text-7xl">From the <i>studio.</i></h2>
        </div>
        {instagramUrl && (
          <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="mono underline-link hidden items-center gap-2 md:flex"><Instagram size={15} aria-hidden="true" /> Follow on Instagram</a>
        )}
      </div>
      <ul className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
        {products.slice(0, 4).map((p) => (
          <li key={p.id} className="relative aspect-square overflow-hidden bg-[hsl(var(--muted))]">
            <Link href={`/shop/${p.slug}`} className="absolute inset-0" aria-label={p.name}>
              <LoziaImage src={p.images[0]?.src} alt="" fill sizes="(min-width: 768px) 25vw, 50vw" className="image-hover object-cover" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
