import { CategoryTiles, FeaturedCollection, FeaturedPieces, Hero, LoziaWoman } from '@/components/home/sections';
import { listCategories, listPublishedProducts } from '@/lib/products/queries';
import { getSiteSettings } from '@/lib/settings/queries';

export const dynamic = 'force-dynamic'; // stock and featured pieces are read from the database on every visit

export default async function HomePage() {
  const [settings, products, categories] = await Promise.all([getSiteSettings(), listPublishedProducts(), listCategories()]);
  const featured = products.filter((p) => p.featured).slice(0, 4);
  const editorial = featured[0]?.images[0]?.src ?? products[0]?.images[0]?.src ?? null;

  return (
    <div>
      {settings.homepage.announcement && (
        <div className="bg-[hsl(var(--accent))] px-5 py-2 text-center text-xs text-[hsl(var(--accent-foreground))]">{settings.homepage.announcement}</div>
      )}
      <Hero homepage={settings.homepage} tagline={settings.tagline} />
      <FeaturedCollection products={featured.length ? featured : products.slice(0, 4)} />
      <CategoryTiles categories={categories} products={products} />
      <LoziaWoman image={editorial} />
      <FeaturedPieces products={products} instagramUrl={settings.instagramUrl} />
    </div>
  );
}
