import { CategoryTiles, FeaturedCollection, FeaturedPieces, Hero, LoziaWoman } from '@/components/home/sections';
import { ReviewsSection } from '@/components/home/reviews';
import { listCategories, listPublishedProducts } from '@/lib/products/queries';
import { getSiteSettings } from '@/lib/settings/queries';
import { getSiteImage } from '@/lib/content/site-images';

export const dynamic = 'force-dynamic'; // stock and featured pieces are read from the database on every visit

export default async function HomePage() {
  const [settings, products, categories] = await Promise.all([getSiteSettings(), listPublishedProducts(), listCategories()]);
  const featured = products.filter((p) => p.featured).slice(0, 4);

  return (
    <div>
      {settings.homepage.announcement && (
        <div className="bg-[hsl(var(--accent))] px-5 py-2 text-center text-xs text-[hsl(var(--accent-foreground))]">{settings.homepage.announcement}</div>
      )}
      <Hero homepage={settings.homepage} tagline={settings.tagline} image={getSiteImage(settings.siteImages, 'home_hero')} />
      <FeaturedCollection products={featured.length ? featured : products.slice(0, 4)} />
      <CategoryTiles categories={categories} products={products} siteImages={settings.siteImages} />
      <LoziaWoman image={getSiteImage(settings.siteImages, 'home_editorial')} />
      <FeaturedPieces products={products} instagramUrl={settings.instagramUrl} />
      <ReviewsSection reviewSubmissionEnabled={settings.reviewSubmissionEnabled} />
    </div>
  );
}
